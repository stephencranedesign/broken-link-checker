var SiteService = require("../services/sites.js");
var PagesService = require("../services/pages.js");
var ResourcesService = require("../services/Resources.js");
var crawler = require("../custom-modules/crawler.js");
var scheduler = require("../custom-modules/scheduler.js");
var recursiveCheck = require("../custom-modules/utils").recursiveCheck;
var Promise = require('bluebird');

module.exports.saveSite = function (user, site) {
	return ResourcesService.insertMany(site.resources)
		.then(PagesService.insertMany(site.pages))
		.then(SiteService.save(site.user, site))
		.then(function() {
			return {
				message: "site successfully crawled",
				status: 0,
				err: null
			};
		});
};

function _clearPages(query) {
	return new Promise(function(resolve, reject) {
		PagesService.remove(query, function() {
			resolve();
		}, function(err) {
			reject({ message: "error saving pages",  err: err, status: 0 });
		});
	});
}

function _clearResources(query) {
	return new Promise(function(resolve, reject) {
		ResourcesService.remove(query, function() {
			resolve();
		}, function(err) {
			reject({ message: "error saving resources",  err: err, status: 0 });
		});
	});
}

function _clearSite(query) {
	return new Promise(function(resolve, reject) {
		SiteService.remove(query, function() {
			SiteService.remove(query, function() {
				resolve();
			}, function(err) {
				reject({ message: "error deleteing site", err: err, status: 0 });
			})
		});
	});
}

module.exports.clearPagesAndResourcesForSite = function(user, url, callback, errback) {
	return new Promise(function(resolve, reject) {
		var query = { user: user, _siteUrl: url };
		_clearPages(query).then(_clearResources(query)).then(function(val) {
			resolve({ message: "site successfully crawled", status: 1, err: null });
		}).catch(function(err) {
			reject(err);
		});
	});
};

module.exports.updateSite = function(user, site, callback, errback) {
	console.log('updateSite: ', user, site.url);

	module.exports.clearPagesAndResourcesForSite(user, site.url)
	.then(function(obj) {
		console.log('should have dropped stuff for rest of site');
		return module.exports.saveSite(user, site);
	})
	.then(function(obj) {
		callback(obj);
	})
	.catch(function(err) {
		errback(err);
	});
};


module.exports.unregisterSite = function(user, url, callback, errback) {
	var query = { user: user, _siteUrl: url };
	return _clearPages(query)
		.then(_clearResources(query))
		.then(_clearSite({ user: user, url: url }))
		.then(function() {
			callback({
				message: "site successfully unregistered",
				status: 1,
				err: null
			});
		})
		.catch(function(o) {
			errback(o);
		});
};

