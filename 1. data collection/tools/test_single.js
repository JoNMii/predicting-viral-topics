'use strict';

/*
	test_single.js - test Facebook Open Graph API requests on a single article
 */

var FB = require('fb');
var querystring = require('querystring');
var fs = require('fs');

var fb = new FB.Facebook({
	appId: '<YOUR APP ID>',
	secret: '<YOUR APP SECRET>',
	timeout: 0 // wait as long as required (no timeout)
});
fb.setAccessToken('<YOUR ACCESS TOKEN>');

//var url = 'http://www.finextra.com/newsarticle/28851/scotland-to-map-out-five-year-strategy-for-fintech-growth';
var url = 'https://www.entrepreneur.com/article/29282';

// Step 1: request Open Graph data for the URL
fb.api('/?id=' + querystring.escape(url), function (res) {
	if (!res || res.error) {
		console.log(!res ? 'error occurred' : res.error);
		return;
	}

	var id = res.og_object.id;
	var share_count = res.share.share_count;
	var comment_count = res.share.comment_count;

	// Step 2: request likes (available separately)
	fb.api('/' + id + '/likes?summary=true', function (res) {
		if (!res || res.error) {
			console.log(!res ? 'error occurred' : res.error);
			return;
		}

		var likes_count = res.summary.total_count;

        // Output all the collected stats
		console.log(id, share_count, comment_count, likes_count, url);
	});
});
