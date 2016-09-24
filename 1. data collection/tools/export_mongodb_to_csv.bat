REM Export all articles from MongoDB into CSV format
mongoexport --db idp --collection articles --out articles.csv --type=csv --fields "url,fb_id,fb_shares,fb_likes,fb_comments,fb_title,text,complexity.flesch,complexity.flesch-kincaid,complexity.coleman-liau,complexity.smog,complexity.automated"
