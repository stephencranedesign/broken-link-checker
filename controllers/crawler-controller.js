var SiteService = require("../services/sites.js");
var PagesService = require("../services/pages.js");
var ResourcesService = require("../services/Resources.js");
var crawler = require("../custom-modules/crawler.js");
var scheduler = require("../custom-modules/scheduler.js");
var recursiveCheck = require("../custom-modules/utils").recursiveCheck;


module.exports.saveSite = function (user, site, callback, errback) {

	var pagesSaved = -1, 
		resourcesSaved = -1, 
		sitesSaved = -1,
		resources, 
		pages,
		sites,
		pagesErr,
		resourcesErr,
		sitesErr;

	console.log('site pages: ', site.pages);
	console.log('site resources: ', site.resources);

	try {
		// save pages to db
		PagesService.insertMany(site.pages, function(pages) {
			pages = pages;
			pagesSaved = 1;
		}, function(err) {
			console.log('err tyring to save to pages: ', err);
			pagesSaved = 0;
			pagesErr = err;
		});

		// save resources to db
		ResourcesService.insertMany(site.resources, function(resources) {
			resources = resources;
			resourcesSaved = 1;
		}, function(err) {
			console.log('err tyring to save to pages: ', err);
			resourcesSaved = 0;
			resourcesErr = err;
		});

		// save sites to db
		SiteService.save(site.user, site, function(site) {
			site = site;
			siteSaved = 1;
		}, function(err) {
			console.log('err tyring to save to pages: ', err);
			siteSaved = 0;
			siteErr = err;
		});

	} catch(e) {
		console.log('error: ', e);
	}

	// waits till above is complete..
	recursiveCheck(function() {
		if( resourcesSaved != -1 && pagesSaved != -1 && siteSaved != -1 ) return true;
		else return false;
	}).then(function() {
		if( resourcesSaved && pagesSaved && siteSaved ) callback({
			message: "site successfully crawled",
			status: 1,
			err: null
		});
		
		else if( resourcesSaved && !pagesSaved && siteSaved ) errback({
			message: "error saving pages",
			err: pagesErr,
			status: 0
		});

		else if( !resourcesSaved && pagesSaved && siteSaved ) errback({
			message: "error saving resources",
			err: resourcesErr,
			status: 0
		});

		else if( resourcesSaved && pagesSaved && !siteSaved ) errback({
			message: "error saving site",
			err: resourcesErr,
			status: 0
		});

		else errback({
			message: "multiple errors saving to db",
			pagesErr: pagesErr,
			resourcesErr: resourcesErr,
			siteErr: siteErr,
			status: 0
		});
	});
};

module.exports.clearPagesAndResourcesForSite = function(user, url, callback, errback) {

	var pagesRemoved = -1,
		pagesErr = null,
		resourcesRemoved = -1,
		resourcesErr = null;

	PagesService.remove({ user: user, _siteUrl: url }, function() {
		pagesRemoved = 1;
	}, function(err) {
		pagesRemoved = 0;
		pagesErr = err;
		console.log('error trying to delete pages for url');
	});

	ResourcesService.remove({ user: user, _siteUrl: url }, function() {
		resourcesRemoved = 1;
	}, function(err) {
		resourcesRemoved = 0;
		resourcesErr = err;
		console.log('error trying to delete resources for url');
	});


	recursiveCheck(function() {
		if( resourcesRemoved != 0 && pagesRemoved != 0 ) return true;
		else return false;
	}).then(function() {
		if( resourcesRemoved && pagesRemoved ) callback({
			message: "site successfully crawled",
			status: 1,
			err: null
		});
		
		else if( resourcesRemoved && pagesRemoved === -1 ) errback({
			message: "error saving pages",
			err: pagesErr,
			status: 0
		});

		else if( resourcesRemoved === -1 && pagesRemoved ) errback({
			message: "error saving resources",
			err: resourcesErr,
			status: 0
		});

		else errback({
			message: "error saving pages && resouces",
			pagesErr: pagesErr,
			resourcesErr: resourcesErr,
			status: 0
		});
	});
};

module.exports.updateSite = function(user, site, callback, errback) {
	console.log('updateSite: ', site);
	module.exports.clearPagesAndResourcesForSite(user, site.url, function() {
		console.log('should have dropped stuff for rest of site');
		module.exports.saveSite(user, site, callback, errback);
	}, function(err) {
		errback(err);
	});
};

module.exports.unregisterSite = function(user, url, callback, errback) {

	console.log('unregisterSite: ', user, url);

    var pagesSaved = -1, 
		resourcesSaved = -1, 
		sitesSaved = -1,
		resources, 
		pages,
		sites,
		pagesErr,
		resourcesErr,
		sitesErr;

	// save pages to db
	PagesService.remove({_siteUrl: url, user: user}, function(pages) {
		pages = pages;
		pagesSaved = 1;
	}, function(err) {
		console.log('err tyring to delete to pages: ', err);
		pagesSaved = 0;
		pagesErr = err;
	});

	// save resources to db
	ResourcesService.remove({_siteUrl: url, user: user}, function(resources) {
		resources = resources;
		resourcesSaved = 1;
	}, function(err) {
		console.log('err tyring to delete to resources: ', err);
		resourcesSaved = 0;
		resourcesErr = err;
	});

	// save sites to db
	SiteService.remove({ url: url, user: user }, function(site) {
		site = site;
		siteSaved = 1;
	}, function(err) {
		console.log('err tyring to delete to sites: ', err);
		siteSaved = 0;
		siteErr = err;
	});

	// waits till above is complete..
	recursiveCheck(function() {
		if( resourcesSaved != -1 && pagesSaved != -1 && siteSaved != -1 ) return true;
		else return false;
	}).then(function() {
		if( resourcesSaved && pagesSaved && siteSaved ) callback({
			message: "site successfully unregistered",
			status: 1,
			err: null
		});
		
		else if( resourcesSaved && !pagesSaved && siteSaved ) errback({
			message: "error deleteing pages",
			err: pagesErr,
			status: 0
		});

		else if( !resourcesSaved && pagesSaved && siteSaved ) errback({
			message: "error deleteing resources",
			err: resourcesErr,
			status: 0
		});

		else if( resourcesSaved && pagesSaved && !siteSaved ) errback({
			message: "error deleteing site",
			err: resourcesErr,
			status: 0
		});

		else errback({
			message: "multiple errors deleteing site",
			pagesErr: pagesErr,
			resourcesErr: resourcesErr,
			siteErr: siteErr,
			status: 0
		});
	});
};

module.exports.flush = function(callback, errback) {

    var pagesSaved = -1, 
		resourcesSaved = -1, 
		sitesSaved = -1,
		resources, 
		pages,
		sites,
		pagesErr,
		resourcesErr,
		sitesErr;

	// save pages to db
	PagesService.drop(function(pages) {
		pages = pages;
		pagesSaved = 1;
	}, function(err) {
		console.log('err tyring to drop to pages: ', err);
		pagesSaved = 0;
		pagesErr = err;
	});

	// save resources to db
	ResourcesService.drop(function(resources) {
		resources = resources;
		resourcesSaved = 1;
	}, function(err) {
		console.log('err tyring to drop to resources: ', err);
		resourcesSaved = 0;
		resourcesErr = err;
	});

	// save sites to db
	SiteService.drop(function(site) {
		site = site;
		siteSaved = 1;
	}, function(err) {
		console.log('err tyring to drop to sites: ', err);
		siteSaved = 0;
		siteErr = err;
	});

	// waits till above is complete..
	recursiveCheck(function() {
		if( resourcesSaved != -1 && pagesSaved != -1 && siteSaved != -1 ) return true;
		else return false;
	}).then(function() {
		if( resourcesSaved && pagesSaved && siteSaved ) callback({
			message: "site successfully unregistered",
			status: 1,
			err: null
		});
		
		else if( resourcesSaved && !pagesSaved && siteSaved ) errback({
			message: "error dropping pages",
			err: pagesErr,
			status: 0
		});

		else if( !resourcesSaved && pagesSaved && siteSaved ) errback({
			message: "error dropping resources",
			err: resourcesErr,
			status: 0
		});

		else if( resourcesSaved && pagesSaved && !siteSaved ) errback({
			message: "error dropping site",
			err: resourcesErr,
			status: 0
		});

		else errback({
			message: "multiple errors dropping site",
			pagesErr: pagesErr,
			resourcesErr: resourcesErr,
			siteErr: siteErr,
			status: 0
		});
	});
};

module.exports.getResourcesForSite = function(query, callback, errback) {
	
};
