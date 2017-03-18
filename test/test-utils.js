var Resource = require('../custom-modules/Resource');
var Page = require('../custom-modules/Page');

var Promise = require('bluebird');

var pagesService = require('../services/pages');
var resourcesService = require('../services/resources');

module.exports.asyncTimeout = function(callback, delay) {
	return new Promise(function(fulfill, reject) {
		setTimeout(function() {
			callback(fulfill, reject)
		}, delay);
	});
};

module.exports.siteFromDb = function(config) {
	return {
		user: process.env.testUser,
		url: process.env.testHost,
		brokenResources: config.brokenResources || [],
		crawlDurationInSeconds: config.crawlDurationInSeconds || 10,
		crawlFrequency: config.crawlFrequency || 300,
		crawlOptions: config.crawlOptions || {},
		date: config.date || "2016-07-14T14:50:31.000Z",
		downloadedResources: config.downloadedResources || [],
		fetchTimeouts: config.fetchTimeouts || [],
		redirectedResources: config.redirectedResources || [],
		url: config.url || process.env.testHost
	}
};

function MockQueueItem(baseUrl, path, status, referrer) {
	this.url = baseUrl+path;
	this.protocol = "http";
	this.host = "host";
	this.port = "8080";
	this.path = path;
	this.uriPath =  "uriPath";
	this.depth = 0;
	this.fetched = true;
	this.status = status;
	this.stateData = {};

	if(referrer) this.referrer = referrer;

	return this;
}

function MockResource(path, status, referrer) {
	var queueItem = new MockQueueItem(process.env.testHost, path, status, referrer);
	return new Resource(process.env.testUser, process.env.testHost, false, queueItem);
}

function MockPage(path, resources) {
	var page = new Page(process.env.testUser, process.env.testHost, process.env.testHost+path, path);
	page.resources = page.resources.concat(resources);
	return page;
}

function fillPages() {
	return new Promise(function(resolve, reject) {
		console.log('fillPages');
		var pages = [];

		pages.push(MockPage("/test", ["/"]));
		pages.push(MockPage("/test-2", ["/"]));
		pages.push(MockPage("/test-3", ["/"]));
		pages.push(MockPage("/test-4", ["/"]));
		pages.push(MockPage("/test-5", ["/"]));

		pagesService.insertMany(pages)
		.then(function(docs) {
			console.log('docs: ', docs);
			resolve(docs);
		})
		.catch(function(err) {
			console.log('err: ', err);
			reject(err);
		});
	});
};

function fillResources() {
	console.log('fillResources 1');
	return new Promise(function(resolve, reject) {
		console.log('fillResources');
		var resources = [];

		resources.push(MockResource("/test", true, "/"));
		resources.push(MockResource("/test-2", true, "/"));
		resources.push(MockResource("/test-3", true, "/"));
		resources.push(MockResource("/test-4", true, "/"));
		resources.push(MockResource("/test-5", true, "/"));

		resourcesService.insertMany(resources)
		.then(function(docs) {
			resolve(docs);
		})
		.catch(function(err) {
			reject(err);
		});
	});
}

module.exports.MockQueueItem = MockQueueItem;
module.exports.MockResource = MockResource;
module.exports.MockPage = MockPage;
module.exports.fillPages = fillPages;
module.exports.fillResources = fillResources;

