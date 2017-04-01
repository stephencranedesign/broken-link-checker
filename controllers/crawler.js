var fs = require("fs");
var CORS = require('../custom-modules/CORS');
var crawler = require("../custom-modules/crawler.js");
var sites = require("../custom-modules/sites.js");
var currCrawls = require("../custom-modules/CurrCrawls").currCrawls;

var SitesService = require("../services/sites.js");
var ResourcesService = require("../services/resources.js");

var normalizeUrl = require("../custom-modules/utils").normalizeUrl;
var Site = require('../custom-modules/Site').Site;

function syncDbSitesWithNode() {
	SitesService.list('all') 
	    .then(function(array) {
	        if(process.env.enviornment === 'unitTests') return;
	        array.forEach(function(siteFromDb) {
	            var saveStubToDb = false;
	            var site = new Site(siteFromDb.user, siteFromDb.url, siteFromDb.crawlFrequency, siteFromDb.crawlOptions);
	            sites.register(site, saveStubToDb);
	        });
	    })
	    .catch(function(err) {
	        console.log('err: ', err);
	    });
}

/* 
	i think that routes should try to not have defined functions and they should just hook stuff up to functions defined in controllers. 
	To Do:
		- move functions for start crawl / registerSite into crawler-controller
		- Question: what's the difference between custom-modules and -controller? What is a controller in general?
		- Answer: router should pass off tasks to controller. custom-modules are custom modules I define. Controllers should be the glue between routes and services.
*/
function startCrawl(user, url, config, callback, errback) {

	console.log('starting Crawl for user: ', user, 'url: ', url);
	// crawling already happening for url
	if(currCrawls.isCrawlingSite(url)) {
		errback({message: "crawling already in process", url});
	}

	crawler.crawl(user, url, config, function(site) {
		console.log('finished crawling and about to save to db', user, url);

		if( !sites.isRegistered(user, url) ) {
			callback({
				message: 'site was not registered at the time it was attempted to be saved.',
				status: 0,
				site: null,
				err: null
			});

			return;
		}

		else _updateSite(user, site, callback, errback);
	});
};

function _updateSite(user, site, callback, errback) {
	console.log('updateSite: ', user, site.url);

	ResourcesService.remove({ user: user, _siteUrl: site.url })
		.then(ResourcesService.insertMany(site.brokenResources))
		.then(function() {
			return SitesService.save(site.user, site);
		})
		.then(function(obj) {
			console.log('hi: ', obj);
			callback({
				message: "site successfully crawled",
				status: 1,
				err: null
			});
		})
		.catch(function(err) {
			errback(err);
		});
};


function statusForUserSite(req, res) {
	var user = req.params.user;
	var host = normalizeUrl(req.params.host);
	res.json({crawling: currCrawls.isCrawlingSite(user, host), host: host});
};

function _setTimerCallbackForCrawler(site) {
	/* callback should restart timer */
    site.timer.setCallback(function(reStartTimer) {
        console.log('timer callback from register');

        if( currCrawls.isCrawlingSite(site.user, site.url) ) return reStartTimer(true);

        startCrawl(site.user, site.url, site.crawlOptions, function(o) {
            console.log('o: ', o);
            console.log(o.message, ' ',site.url);
            reStartTimer(true);
        }.bind(site), function(err) {
            console.log("err trying to crawl site from register: ", site.url, " ", err);
            reStartTimer(true);
        }.bind(site));
    });

    site.timer.start(); 
};

function registerEndPoint(req, res) {

	var host = normalizeUrl(req.params.host);
	var user = req.params.user;

	console.log('register: ', host, user);

	SitesService.findSite(user, host, function(doc) {

		console.log('register findSite');

		/* site registered - dont do anything */
		if(doc.site !== null) {
			console.log("site already registered");
			res.status(200);
			res.json({ message: "site already registered" });
			return;
		}

		var site = new Site(user, host, req.body.crawlFrequency, req.body);

		console.log('site: ', site);

		/* save site to db. */
		var saveStubToDb = true;

		_setTimerCallbackForCrawler(site);
		sites.register(site, saveStubToDb, function() {

			console.log('registerSite success: ');

			startCrawl(user, site.url, site.crawlOptions, function(o) {
				if(o.status) console.log(o.message);
				else console.log(o.message);
			}, function(err) {
				console.log("err trying to crawl site: ", site.url, " ", err);
			});

			res.json({message: "site successfully registered"});
		}, function(err) {
			console.log('registerSite err: ', err);
			res.status(400).json(err);
		});

	}, function(err) {
		console.log("err trying to register crawler with url: ", err);
		res.status(400).json(err);
	});
};

function unRegisterEndPoint(req, res) {
	console.log('unregistered endpoint', req.params.host);
	var host = normalizeUrl(req.params.host);
	var user = req.params.user;

	ResourcesService.remove({ user: user, _siteUrl: host })
		.then(function() {
			return sites.unRegister(user, host);
		})
		.then(function() {
			res.json({message: "site successfully unregistered"});
		})
		.catch(function(err) {
			res.status(400).json(err);
		});
};

function status(req, res) {
	CORS.enable(res);
	if(!currCrawls.isIdle()) res.json({ status: 'crawling', crawls: currCrawls.reportStatus() });
	else res.json({ status: 'idle', crawls: currCrawls.reportStatus() });
};

module.exports.statusForUserSite = statusForUserSite;
module.exports.registerEndPoint = registerEndPoint;
module.exports.unRegisterEndPoint = unRegisterEndPoint;
module.exports.status = status;
module.exports.startCrawl = startCrawl;
module.exports.syncDbSitesWithNode = syncDbSitesWithNode;
