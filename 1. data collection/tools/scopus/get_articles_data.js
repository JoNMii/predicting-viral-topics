'use strict';

var fs = require('fs');
var request = require('request');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

// Database data
var url = 'mongodb://localhost/scopus';
var collectionName = 'articles';
var API_KEY = '<YOUR API KEY>';
var QUERY_STRING = 'issn(0960-085X) or issn(1350-1917) or issn(1047-7047) or issn(1536-9323) or issn(0268-3962) or issn(0742-1222) or issn(0963-8687) or issn(0276-7783)';

var db;

// Use connect method to connect to the server
MongoClient.connect(url, function (err, _db) {
	db = _db;
	console.log("Connected succesfully to the database");

	// ensures unique articles only
	db.collection(collectionName).createIndex({'dc:identifier': 1}, {unique: true}, function (err) {
		if (err) {
			console.error(err);
			exit(err);
		}
		console.log('Index created successfully.');

		main();
	});
});

function getURL(startIndex) {
	return 'https://api.elsevier.com/content/search/scopus?query=' + QUERY_STRING + '&sort=+citedby-count&view=COMPLETE&start=' + startIndex;
}

var options = {
	headers: {
		'Accept' : 'application/json',
		'X-ELS-APIKey': API_KEY
	}
};

function main() {

	var articles_inserted = 0;

	function download(startIndex) {
		if (!startIndex) {
			startIndex = 0;
		}

		var articlesBefore = articles_inserted;

		options.url = getURL(startIndex);

		request(options, function (err, response, body) {
			if (err) {
				console.error(err);
				exit(err);
			}
			if (response.statusCode !== 200) {
				console.error('Status code:', response.statusCode);
				console.log(body);
			} else {
				body = body.replace(/[$]/g, '#'); // workaround for MongoDB (it does not permit keys starting with '$'
				var data = JSON.parse(body);

				console.log('Start index:', data["search-results"]["opensearch:startIndex"]);
				var itemsPerPage = data["search-results"]["opensearch:itemsPerPage"];
				console.log('Count:', itemsPerPage);

				var counter = 0;

				data["search-results"].entry.forEach(function (entry) {
					db.collection(collectionName).insert(entry, function (err, docs) {
						counter += 1;
						if (err) {
							console.error('Error while inserting item with \'dc:identifier\' =', entry['dc:identifier']);
							if (err.code === 11000) {
								console.error('Duplicate!');
							} else {
								console.error(JSON.stringify(err));
							}
						} else {
							articles_inserted += 1;
							console.log('Successfully added', articles_inserted, 'new articles');
						}

						if (articles_inserted - articlesBefore === 25) {
							console.log('Downloading next 25 articles...');
							download(startIndex + 25);
						} else if (counter === 25) {
							console.log('Something went wrong. Terminating...');
							exit(1);
						}
					});
				});
			}
		});
	}

	download();
}

function exit(err) {
	if (db) {
		console.log('Closing database...');
		db.close();
	}
	if (err) {
		process.exit(1);
	} else {
		process.exit(0);
	}
}
