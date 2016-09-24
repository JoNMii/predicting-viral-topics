'use strict';

/*
 get_social_stats.js - parses the plain text out of the previously collected HTML for each article.
 Iterates through the database records, extracts the texts according to the config (see below)
 */

var FB = require('fb');
var querystring = require('querystring');
var fs = require('fs');
var mongoose = require('mongoose');
var walk = require('walk');
var path = require('path');

var fb = new FB.Facebook({
	appId: '<YOUR FACEBOOK APP ID>',
	secret: '<YOUR FACEBOOK APP SECRET>',
	timeout: 0 // wait as long as required
});
fb.setAccessToken('<YOUR FACEBOOK ACCESS TOKEN>');

// Mongoose schema for articles. Note social stats
// URL is ensured to be unique
var ArticleSchema = mongoose.Schema({
	html: String,
	url: {type: String, index: {unique: true}},
	fb_id: String,
	fb_shares: Number,
	fb_comments: Number,
	fb_description: String,
	fb_title: String,
	fb_type: String,
	fb_likes: Number
});

// Connecting to the database
mongoose.connect('mongodb://localhost/idp');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
	console.log('Connected to database!');
});

// Creating the model object and running main code once the collection
// is done indexing (returns immediately if already indexed)
var Article = mongoose.model('Article', ArticleSchema);
Article.on('index', function (err) {
	if (err) {
		throw 'Error while creating index:' + err;
	}
	console.log('Created index successfully!');

	main(function () {
		db.close();
	});
});

// Custom article saving function - overwrites existing records
// or creates a record if not found
function saveArticle(object, callback) {
	Article.update({url: object.url}, object, {upsert: true}, function (err, raw) {
		if (err) {
			console.log('Error:', err.errmsg);
			if (typeof callback === 'function') {
				callback(err);
			}
			return handleError(err);
		}
		console.log('Saved successfully!');

		if (typeof callback === 'function') {
			callback(err);
		}
	});
}

// Main function - traverse all the downloaded files, perform API requests
// for social stats, then save it all to the database
function main(callback) {
	// var target = 'www.finextra.com/newsarticle';
	// var target = 'www.entrepreneur.com/article';
	var target = 'www.investopedia.com/articles';

	var targetPath = path.join('./downloads', target);
	var walker = walk.walk(targetPath);

	// Traverse all the files (articles)
	walker.on('file', function processFile(root, fileStats, next) {
		var filepath = path.join(root, fileStats.name);

		// Note: use https for FinExtra, Entrepreneur
		var url = 'http://';
		if (target.startsWith('www.finextra.com')
		 || target.startsWith('www.entrepreneur.com')) {
			url = 'https://'
		}
		url += target;
		url = url.replace(/\\/g, '/');

		console.log('>>>', url);
		console.error('/?id=' + querystring.escape(url));

		var filedata = fs.readFileSync(filepath);

		// Step 1: get ID and shares/comments count
		console.log('Requesting Facebook stats for: "' + url + '"');
		fb.api('/?id=' + querystring.escape(url), function (res) {
			if (!res || res.error) {
				console.log(!res ? 'error occurred' : res.error);
				next();
				return;
			}
			// console.log('>>>', res);

			var id = res.og_object && res.og_object.id;

			//console.log(res.summary.total_count);

			var share_count = res.share && res.share.share_count;
			var comment_count = res.share && res.share.comment_count;

			var object = {
				html: filedata,
				url: url
			};

			// Carefully initialize 'object'
			if (id) {
				object.fb_id = id;
			}
			if (res.og_object && res.og_object.description) {
				object.fb_description = res.og_object.description;
			}
			if (res.og_object && res.og_object.title) {
				object.fb_title = res.og_object.title;
			}
			if (res.og_object && res.og_object.type) {
				object.fb_type = res.og_object.type;
			}
			if (share_count) {
				object.fb_shares = share_count;
			}
			if (comment_count) {
				object.fb_comments = comment_count;
			}

			// Step 2: get likes
			if (id) {
				console.log('Requesting Facebook likes for: "' + url + '"');
				fb.api('/' + id + '/likes?summary=true', function (res) {
					if (!res || res.error) {
						console.log(!res ? 'error occurred' : res.error);
						return;
					}

					// console.log('response:', res);

					var likes_count = res.summary.total_count;

					if (likes_count) {
						object.fb_likes = likes_count;
					}

					console.log(id, share_count, comment_count, likes_count, url);

					saveArticle(object, function (err) {
						next();
					});
				});
			} else {
				// This may happen if the article is not within the Open Graph
				// Most likely the HTML of the article has not Open Graph markup
				console.error('WARNING: no og_object found: ' + JSON.stringify(res));

				saveArticle(object, function (err) {
					next();
				});
			}
		});
	});

	walker.on('errors', function (root, nodeStatsArray, next) {
		console.error('Error:', root);
		next();
	});

	walker.on('end', function () {
		console.log('Finished traversing!');

		if (typeof callback === 'function') {
			callback();
		}
	});
}
