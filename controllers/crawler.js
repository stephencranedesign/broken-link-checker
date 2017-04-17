var fs = require("fs");
var CORS = require('../custom-modules/CORS');
var crawler = require("../custom-modules/crawler.js");
var sites = require("../custom-modules/sites.js");
var currCrawls = require("../custom-modules/CurrCrawls").currCrawls;

var SitesService = require("../services/sites.js");
var Resources = require("../services/resources.js");

var normalizeUrl = require("../custom-modules/utils").normalizeUrl;
var Site = require('../custom-modules/Site').Site;

var Promise = require('bluebird');

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
	if(sites.isCrawling(user, url)) {
		errback({message: "crawling already in process", url});
	}

	crawler.crawl(user, url, config, function(site) {
		console.log('finished crawling and about to save to db', user, url);

		var siteUpdate = {
			url: site.url, 
	        user: user,
	        date: new Date().toLocaleString(), 
	        brokenResources: site.brokenResources,
	        worstOffenders: site.worstOffenders,
	        crawlFrequency: site.crawlFrequency,
	        crawlOptions: site.crawlOptions,
	        crawlDurationInSeconds: site.crawlDurationInSeconds,
	        totalPages: site.totalPages
		};

		_updateSite(siteUpdate, callback, errback);
	});
};

function _updateSite(update, callback, errback) {
	console.log('updateSite: ', update.user, update.url);

	Resources.remove({ user: update.user, _siteUrl: update.url })
		.then(function() {
			return Resources.insertMany(update.brokenResources)
		})

		.then(function() {
			var length = update.brokenResources.length;
			update.brokenResources = length;
			return SitesService.findOneAndUpdate({ user: update.user, url: update.url } , update);
		})
		.then(function(obj) {
			if(obj === null) return SitesService.create(update);
			else Promise.resolve();
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
			console.log('err: ', err);
			errback(err);
		});
};


function statusForUserSite(req, res) {
	var user = req.params.user;
	var host = normalizeUrl(req.params.host);
	res.json({crawling: sites.isCrawling(user, host), host: host});
};

function _setTimerCallbackForCrawler(site) {
	/* callback should restart timer */
    site.timer.setCallback(function(reStartTimer) {
        console.log('timer callback from register');

        if( sites.isCrawling(site.user, site.url) ) return reStartTimer(true);

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

	SitesService.findOne({ user: user, url: host })
		.then(function(doc) {

			console.log('register findOne');

			/* site registered - dont do anything */
			if(doc !== null) {
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

		})
		.catch(function(err) {
			console.log("err trying to register crawler with url: ", err);
			res.status(400).json(err);
		});
};

function unRegisterEndPoint(req, res) {
	console.log('unregistered endpoint', req.params.host);
	var host = normalizeUrl(req.params.host);
	var user = req.params.user;

	Resources.remove({ user: user, _siteUrl: host })
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
