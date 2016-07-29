module.exports.asyncTimeout = function(callback, delay) {
	return new Promise(function(fulfill, reject) {
		setTimeout(function() {
			callback(fulfill, reject)
		}, delay);
	});
};

module.exports.siteFromDb = function(config) {
	return {
		brokenLinks: config.brokenLinks || [],
		crawlDurationInSeconds: config.crawlDurationInSeconds || 10,
		crawlFrequency: config.crawlFrequency || 300,
		crawlOptions: config.crawlOptions || {},
		date: config.date || "2016-07-14T14:50:31.000Z",
		downloadedLinks: config.downloadedLinks || [],
		fetchTimeouts: config.fetchTimeouts || [],
		redirectedLinks: config.redirectedLinks || [],
		url: config.url || "fakeSite.com"
	}
};