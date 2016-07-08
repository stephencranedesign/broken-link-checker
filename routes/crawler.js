var express = require("express");
var router = express.Router();
var crawler = require("../custom-modules/crawler.js");
var SiteService = require("../services/sites.js");
var scheduler = require("../custom-modules/scheduler.js");
var fs = require("fs");

function startCrawl(url, config, callback, errback) {
	crawler.crawl(url, config, function(site) {
		if( !scheduler.isSiteRegistered(url) ) {
			callback({
				message: 'site was not registered at the time it was attempted to be save.',
				status: 0,
				site: null,
				err: null
			});

			return;
		}

		// save to db
		SiteService.save(site, function(doc) {
			console.log("saved to db");
			if(callback) callback({
				message: 'site successfully crawled',
				status: 1,
				site: site,
				err: null
			});
        }, function(err) {
        	console.log("error trying to save to db: ", err);
        	if(errback) errback(err);
        });
	});
};

/*
	syncronous call to register a site and call startCrawl on an interval.
*/
function registerSite(site, saveStubToDb, callback, errback) {
	/* callback should restart timer */
	site.callback = function() {
		startCrawl(this.url, this.crawlOptions, function(o) {
			if(o.status) console.log(o.message, ' ',this.url);
			else console.log(o.message, ' ',this.url);
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
SiteService.list(function(array) {
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

	// crawling already happening for url
	if(crawler.isCrawling(req.params.host)) {
		res.json({message: "crawling already in process", host: req.params.host});
	}

	// start crawling..
	startCrawl(req.params.host, req.body, function(o) {
		if(o.status) res.json({message: o.message});
		else res.json({message: o.message});
	}, function(err) {
		res.status(400).json(err);
	});
});

router.get("/api/crawler/:host/status", function(req, res) {
	res.json({crawling: crawler.isCrawling(req.params.host), host: req.params.host});
});

/* main endpoint to hit for setting up a site to crawl. */
router.post("/api/crawler/:host/register", function(req, res) {
	console.log('register endpoint');
	SiteService.findSite(req.params.host, function(doc) {

		console.log('findSite callback', req.body);

		/* site registered - dont do anything */
		if(doc !== null) {
			console.log("site already registered");
			res.json({ message: "site already registered" });
			return;
		}

		var siteStub = { url: req.params.host, crawlFrequency: req.body.crawlFrequency, crawlOptions: req.body };

		startCrawl(siteStub.url, siteStub.crawlOptions, function(o) {
			if(o.status) console.log(o.message);
			else console.log(o.message);
		}, function(err) {
			console.log("err trying to crawl site: ", siteStub.url, " ", err);
		});

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
	if(req.params.host === 'all') {
        scheduler.flush(function() {
        	res.json({message: 'droppped all sites'});
        }, function(err) {
        	res.status(400).json(err);
        });
	}
	else {
		scheduler.unRegisterSite(req.params.host, function() {
			res.json({message: "site successfully unregistered"});
		}, function(err) {
			res.status(400).json(err);
		});
	}
});

router.get("/api/crawler/status", function(req, res) {
	if(!crawler.isIdle()) res.json({ status: 'crawling', crawls: crawler.currCrawls });
	else res.json({ status: 'idle', crawls: crawler.currCrawls });
});

router.post('/api/crawler/:host/update/:path', function(req, res) {

	// denied..
	if(!scheduler.isSiteRegistered(req.params.host)) res.status(404).json({message: 'site is not registered'});

	

});

module.exports = router;
