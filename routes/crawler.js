var express = require("express");
var router = express.Router();
var crawler = require("../custom-modules/crawler.js");
var scheduler = require("../custom-modules/scheduler.js");
var fs = require("fs");
var CORS = require('../custom-modules/CORS');

var SitesService = require("../services/sites.js");
var PagesService = require("../services/pages.js");
var ResourcesService = require("../services/resources.js");

var recursiveCheck = require("../custom-modules/utils").recursiveCheck;
var normalizeUrl = require("../custom-modules/utils").normalizeUrl;
var crawlerCtrl = require("../controllers/crawler-controller");

function startCrawl(url, config, callback, errback) {

	console.log('starting Crawl for: ', url);
	// crawling already happening for url
	if(crawler.isCrawling(url)) {
		errback({message: "crawling already in process", url});
	}

	crawler.crawl(url, config, function(site) {
		console.log('finished crawling and about to save to db');

		if( !scheduler.isSiteRegistered(url) ) {
			callback({
				message: 'site was not registered at the time it was attempted to be saved.',
				status: 0,
				site: null,
				err: null
			});

			return;
		}

		crawlerCtrl.updateSite(site, callback, errback);
	});
};

/*
	register a site and call startCrawl on an interval.
*/
function registerSite(site, saveStubToDb, callback, errback) {

	/* callback should restart timer */
	site.callback = function() {
		if( crawler.isCrawling(site.url) ) { this.startTimer(); return; }
		startCrawl(this.url, this.crawlOptions, function(o) {
			console.log(o.message, ' ',this.url);
			this.startTimer();
		}.bind(this), function(err) {
			console.log("err trying to crawl site from registerSite: ", this.url, " ", err);
			this.startTimer();
		}.bind(this));
	};

	scheduler.registerSite(site, saveStubToDb, function() {
		if(callback) callback();
	}, function(err) {
		if(errback) errback(err);
	}); 
};

/* 
	registerSavedSites 
	- for any urls saved to db, grab them and register them for a crawl.
*/
SitesService.list(function(array) {
    array.forEach(function(site) {
    	var saveStubToDb = false;
    	registerSite(site, saveStubToDb);
    });
});

/*
	conveinience for starting an immediate crawl. 
	should stop scheduler and reschedule upon completion 
*/
router.post("/api/crawler/:host/start", function(req, res) {
	CORS.enable(res);
	var host = normalizeUrl(req.params.host);
	// crawling already happening for url
	if(crawler.isCrawling(host)) {
		res.json({message: "crawling already in process", host: host});
	}

	SitesService.findSite(host, function(siteFromDb) {

		if(siteFromDb == null) {
			res.json({ message: "site not registered" });
			return;
		}

		console.log('siteFromDb: ', siteFromDb.site);

		siteFromDb.site.crawlOptions.crawlType = 'full-page';

		// start crawling..
		startCrawl(host, siteFromDb.site.crawlOptions, function(o) {
			console.log('startCrawl callback: ', o.status);
			if(o.status) res.json({message: o.message});
			else res.json({message: o.message});
		}, function(err) {
			res.status(400).json(err);
		});
	});
});

router.get("/api/crawler/:host/status", function(req, res) {
	var host = normalizeUrl(req.params.host);
	res.json({crawling: crawler.isCrawling(host), host: host});
});

/* main endpoint to hit for setting up a site to crawl. */
router.post("/api/crawler/:host/register", function(req, res) {
	console.log('register endpoint');
	var host = normalizeUrl(req.params.host);
	SitesService.findSite(host, function(doc) {

		/* site registered - dont do anything */
		if(doc.site !== null) {
			console.log("site already registered");
			res.json({ message: "site already registered" });
			return;
		}

		var siteStub = { url: host, crawlFrequency: req.body.crawlFrequency, crawlOptions: req.body };

		startCrawl(siteStub.url, siteStub.crawlOptions, function(o) {
			if(o.status) console.log(o.message);
			else console.log(o.message);
		}, function(err) {
			console.log("err trying to crawl site: ", siteStub.url, " ", err);
		});

		/* save site to db. */
		var saveStubToDb = true;
		registerSite(siteStub, saveStubToDb, function() {
			res.json({message: "site successfully registered"});
		}, function(err) {
			res.status(400).json(err);
		});

	}, function(err) {
		console.log("err trying to register crawler with url: ", err);
		res.status(400).json(err);
	});
});

router.post("/api/crawler/:host/unRegister", function(req, res) {
	console.log('unregistered endpoint', req.params.host);
	var host = normalizeUrl(req.params.host);
	if(host === 'all') {
        scheduler.flush(function() {
        	res.json({message: 'droppped all sites'});
        }, function(err) {
        	res.status(400).json(err);
        });
	}
	else {
		scheduler.unRegisterSite(host, function() {
			res.json({message: "site successfully unregistered"});
		}, function(err) {
			res.status(400).json(err);
		});
	}
});

router.get("/api/crawler/status", function(req, res) {
	CORS.enable(res);
	if(!crawler.isIdle()) res.json({ status: 'crawling', crawls: crawler.currCrawls });
	else res.json({ status: 'idle', crawls: crawler.currCrawls });
});

router.post("/api/crawler/updatePath", function(req, res) {
	console.log('updatePath');

	/*
		What happens two people call update on different urls?
		- 	i'll need a queue and a way to know if the site is already checked out for an update. 
			If there are others in the queue, do those changes before pushing back to db.
	*/

	var host = req.body.host,
		path = req.body.path;

	console.log('host/path: ', host, path);

	// denied..
	if(!scheduler.isSiteRegistered(host)) res.status(404).json({message: 'site is not registered'});

	crawler.updatePage(host, path, function(updatedSite) {
		console.log('update ready to save to db', updatedSite);
		return;
		SitesService.save(updatedSite, function(updatedSiteFromDb) {
			console.log('update saved');
			res.json(updatedSiteFromDb);
		}, function(err) {
			res.json(err);
		});
	});
});

router.get('/api/crawler/explode', function(req, res) {
	crawler.explode(function(site) {
		SitesService.save(site, function(doc) {
			res.json({message: 'good to go', doc: doc});
		}, function(err) {
			res.json(err);
		});
	}, function(err) {
		res.json(err);
	});
});

module.exports = router;

