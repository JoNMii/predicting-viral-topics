'use strict';

/*
	complexity.js - calculates readability scores for article texts

	1. Iterates over all database records of articles
	2. Applies different readability complexity score formulae to each article
	3. Saves these scores into the same MongoDB collection
 */

var syllable = require('syllable');
var wordCount = require('word-count');
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient;

// Connection URL
var url = 'mongodb://localhost/idp';
var collectionName = 'articles';

/* Modules used:
    https://www.npmjs.com/package/flesch
    https://www.npmjs.com/package/flesch-kincaid
    https://github.com/wooorm/gunning-fog
    https://github.com/wooorm/coleman-liau
    https://www.npmjs.com/package/smog-formula
    https://www.npmjs.com/package/automated-readability
    https://github.com/wooorm/spache-formula
    https://github.com/wooorm/dale-chall-formula
 */
var formulae = [
	{id: 'flesch', name: 'Flesch-Kincaid Reading Ease', f: require('flesch')},
	{id: 'flesch-kincaid', name: 'Flesch-Kincaid Grade Level', f: require('flesch-kincaid')},
	{
		id: 'gunning-fog',
		skip: true, /* Skipping it, see the paper for reference */
		name: 'Gunning-Fog Score',
		f: require('gunning-fog') /* Requires to count complex polysillabic words... */
	},
	{id: 'coleman-liau', name: 'Coleman-Liau Index', f: require('coleman-liau')},
	{id: 'smog', name: 'SMOG Index', f: require('smog-formula')},
	{id: 'automated', name: 'Automated Readability Index', f: require('automated-readability')},
	{
		id: 'spache',
		skip: true, /* Skipping it, see the paper for reference */
		name: 'Spache Score',
		f: require('spache-formula') /* Requires number of unique unfamiliar words... */
	},
	{
		id: 'dale-chall',
		skip: true, /* Skipping it, see the paper for reference */
		name: 'Dale-Chall Score',
		f: require('dale-chall-formula') /* Requires number of unique unfamiliar words... */
	}
];

function countLetters(string) {
	var matches = string.match(/[a-zA-Z]/g);
	return matches && matches.length || 0;
}

function sentenceCount(string) {
	// Address abbreviations like U.S.A., U.K. etc
	// This does not solve the problem fully, but it does improve precision
	string = string.replace(/([A-Z]\.)+/g, '.'); // "U.S.A." --> "."

	var sentences = string.split(/[.]+|[!]|[?]/);

	return sentences.filter(function (sentence) {
		// Ignore empty sentences (i.e. those without any meaningful content)
		return sentence.match(/[a-zA-Z0-9]/);
	}).length;
}

function countPolysillabicWords(string) {
	var words = string.split(/ +/);
	var polysillabicWords = words.filter(function (word) {
		return syllable(word) >= 3;
	});
	return polysillabicWords.length;
}

function countCharacters(string) {
	var matches = string.match(/\w/g);
	return matches && matches.length || 0;
}

// Use connect method to connect to the database server
MongoClient.connect(url, function (err, db) {
	console.log("Connected to the database succesfully");

	// Get number of previously unprocessed articles
	// Note: remove search criteria if you wish to overwrite previously calculated scores
	db.collection(collectionName).find({complexity: {$exists: false}}).count().then(function (counter) {
		console.log('Articles to be processed:', counter);

		db.collection(collectionName).find({complexity: {$exists: false}}).forEach(function (item) {
			console.log(item._id, item.url);

			var text = item.text;
			if (!text) {
				console.error("Error: no 'text' found! We assume all articles have 'text' parsed out of HTML. Article with id " + item._id + " doesn't!");
				return true;
			}

			// The formulae will take this object as an argument
			var stats = {
				sentence: sentenceCount(text),
				word: wordCount(text),
				syllable: syllable(text),
				// complexPolysillabicWord: complexPolysillabicWords
				letter: countLetters(text),
				polysillabicWord: countPolysillabicWords(text),
				character: countCharacters(text)
			};

			// Perform the calculations
			var complexity = {};
			formulae.forEach(function (formula) {
				if (!formula.skip) {
					complexity[formula.id] = formula.f(stats);
				}
			});

			// Store the scores with their corresponding articles
			db.collection(collectionName).updateOne({_id: item._id}, {$set: {complexity: complexity}}, function (err, res) {
				if (err) {
					console.error(err);
				}

				counter--;
				if (counter === 0) {
					console.log('Done. Closing database.');
					db.close();
				}
			});
		});
	});
});
