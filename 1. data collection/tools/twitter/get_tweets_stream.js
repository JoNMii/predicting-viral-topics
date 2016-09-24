'use strict';

var Twitter = require('twitter');
var fs = require('fs');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var TOPIC_TO_TRACK = '#finance'; // Choose what to track (can be multipled words)

// Database data
var url = 'mongodb://localhost/idp';
var collectionName = 'tweets';

// Use connect method to connect to the server
MongoClient.connect(url, function (err, db) {
	console.log("Connected succesfully to the database");

	db.collection('tweets').createIndex({'id_str': 1}, null, function () {
		console.log('Index created successfully.');

		getTweets(db, function (err) {
			if (err) {
				console.error(err);
			}
			console.log('Closing database...');
			db.close();
		});
	});
});

var tweet_count = 0;

var client = new Twitter({
	consumer_key: '<YOUR CONSUMER KEY>',
	consumer_secret: '<YOUR CONSUMER SECRET>',
	access_token_key: '<YOUR ACCESS TOKEN KEY>',
	access_token_secret: '<YOUR ACCESS TOKEN SECRET>'
});

function getTweets(db, callback) {
	client.stream('statuses/filter', {
		track: TOPIC_TO_TRACK

	}, function (stream) {
		stream.on('data', function (event) {
			if (event && event.id) {
				db.collection(collectionName).updateOne({id: event.id}, event, {upsert: true}, function (err) {
					if (err) {
						console.log('Database error:', err);
						return;
					}

					tweet_count += 1;
					console.log('Tweets collected:', tweet_count);
				});
			} else {
				console.log('>>> data:', event);
			}
		});

		stream.on('error', function (error) {
			console.log('An error occurred... Have you initialized your API access token?');
			throw error;
		});
	});
}
