
var CORS = require('../custom-modules/CORS');
var crawler = require("../custom-modules/crawler.js");
var sites = require("../custom-modules/sites.js");
var currCrawls = require("../custom-modules/CurrCrawls").currCrawls;

var SitesService = require("../services/sites.js");
var Resources = require("../services/resources.js");

var normalizeHost = require("../custom-modules/utils").normalizeHost;

var Site = require('../custom-modules/Site').Site;
var SiteUpdate = require('../custom-modules/Site').SiteUpdate;

var Timer = require('timer.js');

var Promise = require('bluebird');
var catchHandlers = require('../custom-modules/promise-catch-handlers');


function syncDbSitesWithNode() {
	SitesService.list('all') 
	    .then(function(array) {
	        if(process.env.enviornment === 'unitTests') return;
	        array.forEach(function(siteFromDb) {
	            var site = new Site(siteFromDb.user, siteFromDb.host);
	            sites.register(site);
	        });
	    })
	    .catch(function(err) {
	        console.log('err: ', err);
	    });
}


function startTimerForNextCrawl(user, host, crawlFrequency) {
	var timer = new Timer();

	console.log('timerstarted: ', user, host);
	timer.start(crawlFrequency).on('end', function () {
		console.log('start crawl from timer');
	  	crawlSequence(user, host, crawlFrequency);
	});
};

function crawl(user, host, config) {
	return new Promise(function(resolve, reject) {
		crawler.crawl(user, host, config, function(obj) {
			console.log('crawl callback');
			startTimerForNextCrawl(user, host, config.crawlFrequency);
			resolve(obj);
		});
	});
};

/*
	takes a site update object and 
		- i think that right now the update object I pass isn't consistant. I think that sometimes it has brokenResources as an array and sometimes it's a number.. should prolly figure that out.
*/
function updateSite(update) {
	console.log('updateSite: ', update.user, update.host);

	// remove resources for site / user
	return Resources.remove({ user: update.user, host: update.host })

		// insert new resources
		.then(function() {
			return Resources.insertMany(update.brokenResources)
		})

		// update site
		.then(function() {
			var length = update.brokenResources.length;
			update.brokenResources = length;
			return SitesService.findOneAndUpdate({ user: update.user, host: update.host } , update);
		})

		// if no site, create one.
		.then(function(obj) {
			if(obj === null) return SitesService.create(update);
			else Promise.resolve();
		});
};

/*
	The main function that manages starting a crawl / updating stuff in the db when it's completed.
*/
function crawlSequence(user, host, siteConfig) {

	return new Promise(function(resolve, reject) {

			// crawling already happening for host
			if(sites.isCrawling(user, host)) {
				reject({message: "crawling already in process", host});
			}

			else resolve();
		})

		// get config
		.then(function() {
			return SitesService.findOne({ user: user, host: host }, { crawlOptions: 1, _id: 0 });
		})

		// crawl site
		.then(function(config) {
			console.log('config: ', config);
			return crawl(user, host, config);
		})

		// get config - mainly for the whitelist. It might have changed over the length of the crawl.
		.then(function(crawledSite) {
			return SitesService.findOne({ user: user, host: host }, { crawlOptions: 1, _id: 0 })
				.then(function(config) {
					return { crawledSite: crawledSite, config: config };
				});
		})

		// update site
		.then(function(o) {

			console.log('crawledSite: ', o.crawledSite);
			console.log('config: ', o.config);

			var siteUpdate = new SiteUpdate(o.config);
			siteUpdate.user = user;
			siteUpdate.host = host;
			siteUpdate.worstOffenders = o.crawledSite.worstOffenders;
			siteUpdate.brokenResources = o.crawledSite.brokenResources;

			return updateSite(siteUpdate)
		})

		// errors.
		.catch(function(err) {
			console.log('error crawling site', err);
		});
}


function statusForUserSite(req, res) {
	var user = req.params.user;
	var host = normalizeHost(req.params.host);
	res.json({crawling: sites.isCrawling(user, host), host: host});
};

function registerEndPoint(req, res) {

	var host = normalizeHost(req.params.host);
	var user = req.params.user;
	var siteUpdate;

	console.log('register: ', host, user);

	SitesService.findOne({ user: user, host: host })
		.then(function(doc) {

			console.log('register findOne', doc);

			/* site registered - dont do anything */
			if(doc !== null) {
				console.log("site already registered");
				throw new catchHandlers.Req200();
			}

			var site = new Site(user, host);
			sites.register(site);

			siteUpdate = new SiteUpdate(site);
			siteUpdate.crawlOptions = req.body;

			console.log('siteUpdate: ', siteUpdate);

			return siteUpdate;

		})
		
		// update existing if already saved to db
		.then(function(siteUpdate) {
			console.log('update site: ', siteUpdate);
			return SitesService.findOneAndUpdate({ user: siteUpdate.user, host: siteUpdate.host } , siteUpdate)
				.then(function(doc) {
					return { doc: doc, siteUpdate: siteUpdate };
				})
		})

		// if not saved to db, create it
		.then(function(obj) {
			console.log('obj: ', obj.siteUpdate);
	        if(obj.doc === null) return SitesService.create(obj.siteUpdate);
	        else Promise.resolve(obj);
	    })

	    // start a crawl 
	    .then(function(obj) {

	    	crawlSequence(user, host, req.body)
	    		.then(function(o) {
	    			console.log('o: ', o);
	    		})
	    		.catch(function(err) {
	    			console.log("err trying to crawl site: ", host, " ", err);
	    		});

			res.json({message: "site successfully registered"});

	    })

	    // 200 status
	    .catch(catchHandlers.Req200, function(obj) {
	    	res.status(200);
			res.json({ message: "site already registered" });
	    })

	    // 404 error
	    .catch(catchHandlers.Req404, function(err) {
	    	console.log("err trying to register crawler with host: ", err);
			res.status(400).json(err);
	    })

	    // catch all
	    .catch(function(err) {
	    	console.log('errs in registerEndPoint: ', err);
	    });
};

function unRegisterEndPoint(req, res) {
	console.log('unregistered endpoint', req.params.host);
	var host = normalizeHost(req.params.host);
	var user = req.params.user;

	Resources.remove({ user: user, host: host })
		.then(function() {
			return sites.unRegister(user, host);
		})
		.then(function() {
			throw new catchHandlers.Req200();
		})
		.catch(catchHandlers.Req200, function() {
			res.status(200);
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
module.exports.crawl = crawl;
module.exports.syncDbSitesWithNode = syncDbSitesWithNode;
