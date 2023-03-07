const brain = require('brain.js');
const ls = require('store');

class Classifier {
	constructor() {
		this.config = {
			iterations: 2,
			log: true,
			logPeriod: 1,
			layers: [10],
		};

		this.classifier = new brain.recurrent.LSTM();
	}

	/**
	 * Normalise text
	 * @param {String} text The text to normalise
	 * @return {String} Normalised text
	 */
	normalise(text) {
		return text.indexOf(' ') > -1 ? `${text.split(' ')[0]} ${text.split(' ')[1]}` : text; // Get only first 2 words
	}

	/**
	 * Classify data
	 * @param {String} text The text to classify
	 * @return {Object} Classification result
	 */
	classify(text) {
		return this.classifier.run(this.normalise(text));
	}

	/**
	 * Build classification data
	 * @return {Object} Classifier
	 */
	async load() {
		try {
			await this.getFile();
			return true;
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	/**
	 * Build classifier
	 * @param  {Object} data Data to be classified
	 * @param  {String} path The path to save the file
	 * @return {Object}      Classifier
	 */
	async build(data = {}) {
		const trainingData = [];
		data.forEach(item => {
			trainingData.push({ input: this.normalise(item.name), output: item.category})
		});

		await this.classifier.train(trainingData, this.config);
		this.saveFile();
		console.info('Classifier saved');

		return this.classifier;
	}

	/**
	 * Filter classification results based on weight
	 * @param  {Object} classifications Classifications
	 * @param  {Number} threshold       Minimum bias threashold
	 * @param  {Number} max             Maximium amount of results
	 * @return {Object}                 Filtered classifications
	 */
	filterClassifications(data, threshold, max) {
		const classifications = data.classifications;
		var list = [];
		for (var i = 0; i < classifications.length; i++) {
			if (classifications[i].score > threshold) {
				if (i > max) {return list;}
				list.push(classifications[i]);
			}
		}
		return list;
	}

	/**
	 * Get a file from a path
	 * @param {String} accountId	Id of account
	 */
	getFile() {
		const data = ls.get('accounts');
		this.classifier.fromJSON(data);
	}

	/**
	 * Saves cached file
	 * @constructor
	 * @param  {Object}   data     		Data to save to file
	 * @return {Promise}
	 */
	saveFile() {	
		const data = this.classifier.toJSON();
		ls.set('accounts', data);
	}
}

module.exports = Classifier;
