'use strict';

/*
	crawler.js - crawls the websites in accordance with its configuration file

	Reads config, then for each of the hosts runs Wget tool with the correct parameters.
	Can continuously re-crawl the host/rule if period is specified (and non-negative)
 */

var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var url_join = require('url-join');
var Config = require('./crawler-config.json');

var pathToWget = path.join(process.cwd(), Config.path_to_wget);

// Run Wget utility in accordance with the config
function wgetCrawler(host, url, options) {
	if (!host) {
		console.log('Error: invalid host ' + host);
		return;
	}
	if (typeof url !== 'string') {
		console.log('Error: invalid url ' + url);
		return;
	}

	var host_url = url_join(host, url);
	console.log('host_url:', host_url);

	// Get options
	var period = options.period || Config.default.period;
	var subdir = options.subdir || Config.default.subdir;
	var reqargs = Config.required.args;
	var args = options.args || Config.default.args;
	args = args.concat(reqargs);

	var regex = '';
	if (args.indexOf('--accept-regex') != -1) {
		regex = args[args.indexOf('--accept-regex') + 1];
	}

	console.log('Setting interval: ', host_url, regex, period);

	// Ensure that the destination is given as absolute path
	var cd = path.join(process.cwd(), Config.download_dir, subdir);
	var pos = args.indexOf('-O');
	if (pos != -1) {
		args[pos + 1] = path.join(cd, args[pos + 1]);
	}

	if (!fs.existsSync(cd)) {
		console.log('Creating directory ' + cd + ' ...');
		fs.mkdirSync(cd);
	}

	// Run the Wget executable while collecting its output
	function crawl() {
		var output = {
			stdout: '',
			stderr: ''
		};
		console.log('Crawling: ', host_url, regex, period);
		// The only format that works well
		args.unshift(host_url);

		console.log('>>> wget ', args.join(' '));
		var wget = spawn(pathToWget, args, {cwd: cd});

		wget.stdout.on('data', function (data) {
			//console.log('stdout: ' + data);
			output.stdout += data;
		});

		wget.stderr.on('data', function (data) {
			console.log('stderr: ' + data);
			output.stderr += data;
		});

		wget.on('close', function (code) {
			//console.log(output.stderr);
			var lines = output.stderr.match(/Saving to: .\S+?.\s/g);
			var links = [];
			for (var i in lines) {
				if (!lines.hasOwnProperty(i)) continue;

				var line = lines[i];
				var match = line.match(/Saving to: .(\S+?).\s/);
				if (match) {
					links.push(match[1]);
				}
			}

			console.log('Child process exited with code ' + code);
			console.log('Finished crawling "' + host_url + '".');
			console.log('Pages downloaded: ' + links);

			if (options.hooks) {
				console.log('Running hooks ' + options.hooks);

				for (var l in links) {
					if (!links.hasOwnProperty(l)) continue;

					var link = links[l];
					var file_path = path.join(cd, link);

					postProcess(file_path, options.hooks);
				}
			}
		});

		if (period > 0) {
			console.error('Setting timeout: ', period);
			setTimeout(crawl, period);
		}
	}

	crawl();
}

// Perform postprocessing
function postProcess(file_path, hooks) {
	console.log('Reading HTML from \'' + file_path + '\'');

	fs.readFile(file_path, 'utf8', function readFileCallback(err, data) {
		if (err) {
			console.error('Error while reading HTML file:', err);
		} else if (!data) {
			console.warn('No HTML read from \'' + file_path + '\'');
		} else {

			function runHook(index, html, final_callback) {
				if (index >= hooks.length) {
					final_callback(html);
					return;
				}

				var hook_file = hooks[index];

				console.log('Running hook \'' + hook_file + '\' on file \'' + file_path + '\'...');

				try {
					var hook = require(hook_file);
					hook.run(html, function next_callback(updated_html) {
						// Run next hook
						runHook(index + 1, updated_html, final_callback);
					});
				} catch (e) {
					console.error('Error while running hook \'' + hook_file + '\': ' + JSON.stringify(e));
					// Run next hook
					runHook(index + 1, html, final_callback);
				}
			}

			runHook(0, data, function final_callback(html) {
				console.log('Writing HTML back to \'' + file_path + '\'');
				fs.writeFileSync(file_path, html);
			});
		}
	});
}

function main() {
	var today = new Date();
	var year = today.getFullYear();
	var month = ('0' + (today.getMonth() + 1)).slice(-2);
	var date = ('0' + today.getDate()).slice(-2);
	var month_xxx = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

	for (var host in Config.hosts) {
		if (!Config.hosts.hasOwnProperty(host)) continue;

		var options = Config.hosts[host];
		for (var url in options.rules) {
			if (!options.rules.hasOwnProperty(url)) continue;

			var rule = options.rules[url];
			var args = rule.args;
			if (args != undefined) {
				var p = args.indexOf('--accept-regex');
				if (p != -1) {
					args[p + 1] = args[p + 1].replace('${year}', year);
					args[p + 1] = args[p + 1].replace('${month}', month);
					args[p + 1] = args[p + 1].replace('${month_xxx}', month_xxx[today.getMonth()]);
					args[p + 1] = args[p + 1].replace('${date}', date);
					console.log(host, args[p + 1]);
				}
			}
			wgetCrawler(host, url, rule);
		}
	}
}

if (require.main === module) {
	main();
}
