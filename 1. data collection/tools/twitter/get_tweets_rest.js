'use strict';

var Twitter = require('twitter');
var fs = require('fs');
var BigInteger = require('big-integer');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var TOPIC_TO_TRACK = '#finance'; // Choose what to track (can be multipled words)

// Database data
var url = 'mongodb://localhost/idp';
var collectionName = 'tweets';

// Use connect method to connect to the server
MongoClient.connect(url, function (err, db) {
	console.log("Connected succesfully to the database");

	db.collection(collectionName).createIndex({'id_str': 1}, null, function () {
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

var params = {
	q: TOPIC_TO_TRACK,
	// include_entities: 1,
	result_type: 'popular',
	count: 100
};

// REST API
function getTweets(db, callback) {
	client.get('search/tweets.json', params, function (error, data, response) {
		if (!error) {
			// console.log('Data length:', JSON.stringify(data).length);
			// console.log(data);

			var tweets = data.statuses;
			var metadata = data.search_metadata;

			// var meta_max_id = metadata.max_id_str;
			// console.log('>>>', meta_max_id);

			//var curr_max_id = BigInteger(0);
			var curr_min_id = BigInteger(-1);

			tweets.forEach(function (item, index, array) {

				//curr_max_id = BigInteger.max(curr_max_id, item.id_str);
				if (curr_min_id.equals(-1)) {
					curr_min_id = BigInteger(item.id_str);
				} else {
					curr_min_id = BigInteger.min(curr_min_id, item.id_str);
				}

				// console.log(item.id_str, curr_min_id.toString());
				// console.log(index, item.text.length, '--->', item.text);
			});

			if (metadata.next_results) {
				console.log('next_results:', metadata.next_results);
			}

			tweet_count += tweets.length;
			console.log('Tweets collected so far:', tweet_count);

			if (metadata.next_results) {
				// Proper way of retrieving next tweets (without repetitions)
				params.max_id = curr_min_id.minus(1).toString();
				console.log('???', params.max_id, 'vs', metadata.next_results);
				getTweets(db, callback);

			} else {
				console.log('Seems like we\'re done! Terminating...');

				if (typeof callback === 'function') {
					callback(null);
				}
			}

			// console.log('>>>', params.max_id, 'vs', metadata.next_results);

			// 	setTimeout(function () {
			// 		console.log(); // Pretty spacing
			// 		getFollowers(file_id + 1, data.next_cursor);
			// 	}, 60 * 1000);
			// }
		} else {
			console.error(error);
		}
	});
}

// This code retrieves info about current rate limit status
// client.get('application/rate_limit_status', {}, function (error, data, response) {
// 	if (error) {
// 		console.error(error);
// 	} else {
// 		console.log('Data length:', JSON.stringify(data).length);
// 		console.log(data.resources.followers);
// 	}
// });
