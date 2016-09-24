'use strict';

/*
	printout_mongodb_data.js - output articles information in a CSV-like format
 */

var header = '"' + [
		'URL',
		'Facebook ID',
		'Flesch-Kincaid Reading Ease',
		'Flesch-Kincaid Grade Level',
		'Colemand-Liau Index',
		'SMOG Index',
		'Automated Readability Index',
		'Facebook Shares'
	].join('"\t"') + '"';

print(header);

var allArticles = db.articles.find({fb_shares: {$exists: true}});
allArticles.forEach(function (article) {
	//print('"' + article.url + '"\t"'+article.fb_title+'"\t' + article.fb_shares);
	var line = '"' + [
			article.url,
			article.fb_id,
			article.complexity['flesch'],
			article.complexity['flesch-kincaid'],
			article.complexity['coleman-liau'],
			article.complexity['smog'],
			article.complexity['automated'],
			article.fb_shares
		].join('"\t"') + '"';

	print(line);
});
