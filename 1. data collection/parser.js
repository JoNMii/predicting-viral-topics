'use strict';

/*
	parser.js - parses the plain text out of the previously collected HTML for each article.
	Iterates through the database records, extracts the texts according to the config (see below)
 */

var fs = require('fs');
var cheerio = require('cheerio');
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var jsdom = require('node-jsdom');
var jquery = fs.readFileSync("./jquery-3.1.0.min.js", "utf-8");

// Database configuration
var url = 'mongodb://localhost/idp';
var collectionName = 'articles';


// Parser config, defined the rules on how to parse the articles out from HTML
// based on CSS selectors
// Note: these may change due to website updates
var config = {
	Investopedia: {
		regex: /www\.investopedia\.com/,
		selector: 'div.content-box > p'
	},
	FinExtra: {
		regex: /www\.finextra\.com/,
		selector: '#ctl00_ctl00_ConMainBody_ConMainBody_ctl01_pnlBody'
		// selector: '.fullWidth.bottomMargin40'
	},
	Entrepreneur: {
		regex: /www\.entrepreneur\.com/,
		selector: '.bodycopy'
	}
};

// Choose on of the config setups at a time
// Note: it is more convenient to run them separately
// for troubleshooting purposes
var cfg = config.Investopedia;

// Use connect method to connect to the database server
MongoClient.connect(url, function (err, db) {
	console.log("Connected succesfully to the database");

	db.collection(collectionName).find({url: {$regex: cfg.regex}, text: {$exists: false}}).count().then(function (counter) {
		console.log('Found articles:', counter);

		if (!counter) {
			console.log('No unprocessed articles found. Nothing to do here. Terminating...');
			cleanupAndTerminate(db);
			return;
		}

		db.collection(collectionName).find({url: {$regex: cfg.regex}, text: {$exists: false}}).forEach(function (item) {
			console.log(item._id, item.url);

			// Initialize JSDom, use local 'jquery' for improved performance and consistency
			jsdom.env(item.html, {
				src: jquery
			}, function (errors, window) {
				if (errors) {
					counter--;
					console.error('>>>', errors);

					if (counter === 0) {
						cleanupAndTerminate(db);
					}
					return;
				}

				// Select the element with text, get text-only data from it and trim spaces
				var text = window.$(cfg.selector).text().trim();

				// Write the updated article back to the database
				console.log('Updating article "' + item.url + '"...', 'Text length:', text.length);
				item.text = text;

				db.collection('articles').updateOne({_id: item._id}, item, function (err, res) {
					if (err) {
						console.error(err);
					}
					counter--;
					if (counter === 0) {
						cleanupAndTerminate(db);
					}
				});
			});
		});
	});
});

function cleanupAndTerminate(db) {
	console.log('Done. Closing database.');
	db.close();
}
