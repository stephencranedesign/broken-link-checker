
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

var heapdump = require('heapdump');

/* should just get rid of this and have calls that ask for if something is registered to just check with the db.. */
function syncDbSitesWithNode() {
	SitesService.find({}) 
	    .then(function(array) {
	        if(process.env.enviornment === 'unitTests') return;
	        array.forEach(function(siteFromDb) {
	            var site = new Site(siteFromDb.user, siteFromDb.host);
	            sites.register(site);
	            registerCrawl(site.user, site.host);
	        });
	    })
	    .catch(function(err) {
	        console.log('err: ', err);
	    });
}


function startTimerForNextCrawl(user, host, crawlFrequency) {
	var timer = new Timer();

	console.log('timerstarted: ', user, host, crawlFrequency);
	timer.start(crawlFrequency).on('end', function () {
		console.log('start crawl from timer: ', user, host, crawlFrequency);
		registerCrawl(user, host);
	  	// crawlSequence(user, host);
	});
};

/*
	@return promise
*/
function crawl(user, host, crawlOptions) {
	console.log('crawl: ', crawlOptions);
	return new Promise(function(resolve, reject) {
		crawler.crawl({
			user: user,
			host: host,
			crawlOptions: crawlOptions,
			comb: _combCrawler,
			complete: function(report) {
				startTimerForNextCrawl(user, host, crawlOptions.crawlFrequency);
				resolve(report);
			}
		});
	});
};

function _combCrawler(report) {

	console.log('_combCrawler: ', report);

	var siteUpdate = new SiteUpdate(report);

	delete siteUpdate['crawlOptions']; // dont need to update the crawlOptions from a comb event.

	if(report.firstComb) updateSiteWithRemove(siteUpdate); /* if its first update of crawl, we want to remove previous inserted resources.. maybe just do that when crawl starts? */
	else updateSiteNoRemove(siteUpdate);
};

// takes a site update object. adds to resources in db and then updats site.
function updateSiteNoRemove(update) {

	if(!update.brokenResources.length) return;

	// insert new resources
	Resources.insertMany(update.brokenResources)

		// get length of broken resources.
		.then(function() {
			return Resources.count({ user: update.user, host: update.host });
		})

		// update site
		.then(function(brokenResourcesCount) {
			update.brokenResources = brokenResourcesCount
			return SitesService.findOneAndUpdate({ user: update.user, host: update.host } , update);
		});
	
};

// takes a site update object. removes all saved resources in db and then adds new resources / updats site.
function updateSiteWithRemove(update) {

	// remove resources for site / user
	return Resources.remove({ user: update.user, host: update.host })

		// insert new resources
		.then(function() {
			if(update.brokenResources.length) return Resources.insertMany(update.brokenResources);
			else Promise.resolve();
		})

		// update site
		.then(function() {
			var length = update.brokenResources.length;
			update.brokenResources = length;
			return SitesService.findOneAndUpdate({ user: update.user, host: update.host } , update);
		})
};

/*
	The main function that manages starting a crawl / updating stuff in the db when it's completed.
	Dont use this directly, use registerCrawl.
*/
function crawlSequence(user, host) {

	process.kill(process.pid, 'SIGUSR2');

	activeCrawls++;

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
		.then(function(site) {
			console.log('site 1: ', site.crawlOptions);
			return crawl(user, host, site.crawlOptions);
		})

		// get config - mainly for the whitelist. It might have been added to over the length of the crawl.
		.then(function(report) {
			return SitesService.findOne({ user: user, host: host }, { crawlOptions: 1, _id: 0 })
				.then(function(site) {
					console.log('site 2: ', site.crawlOptions);
					return { report: report, crawlOptions: site.crawlOptions };
				});
		})

		// update site
		.then(function(o) {

			var siteUpdate = new SiteUpdate(o.report);
			siteUpdate.user = user;
			siteUpdate.host = host;
			siteUpdate.crawlOptions= o.crawlOptions;

			console.log('siteUpdate: ', siteUpdate);

			activeCrawls--;

			// setTimeout(function() {
			// 	global.gc();
			// 	process.kill(process.pid, 'SIGUSR2');
			// }, 15000);

			if(o.report.firstComb) return updateSiteWithRemove(siteUpdate);
			else return updateSiteNoRemove(siteUpdate);
		})

		// errors.
		.catch(function(err) {
			activeCrawls--;
			console.log('error crawling site', err);
		});
}


function statusForUserSiteEndPoint(req, res) {
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

	    	// crawlSequence(user, host)
	    	// 	.then(function(o) {
	    	// 		console.log('o: ', o);
	    	// 	})
	    	// 	.catch(function(err) {
	    	// 		console.log("err trying to crawl site: ", host, " ", err);
	    	// 	});
	    	registerCrawl(user, host);

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

	console.log('unregistered:', host, user);

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

function statusEndPoint(req, res) {
	CORS.enable(res);
	if(!currCrawls.isIdle()) res.json({ status: 'crawling', crawls: currCrawls.reportStatus() });
	else res.json({ status: 'idle', crawls: currCrawls.reportStatus() });
};


// crawl queue. Limit to 1 crawls at a time to keep node from running out of memory.
var queue = [], activeCrawls = 0;

/*
	This is the function to start the magic. 
	starts a crawl as soon as number of crawls drops below specified number
*/
function registerCrawl(user, host) {
	console.log('registerCrawl: ', user, host);
	queue.push(user+'::'+host);
	console.log(activeCrawls);
	if(activeCrawls > 3) return;
	
	startNextInQueue();
}

function startNextInQueue() {
	var arr = queue[0].split('::'),
		user = arr[0],
		host = arr[1];

	console.log('startNextInQueue: ', user, host);
	queue.shift();
	crawlSequence(user, host);
}




module.exports.statusForUserSiteEndPoint = statusForUserSiteEndPoint;
module.exports.registerEndPoint = registerEndPoint;
module.exports.unRegisterEndPoint = unRegisterEndPoint;
module.exports.statusEndPoint = statusEndPoint;
module.exports.crawl = crawl;
module.exports.syncDbSitesWithNode = syncDbSitesWithNode;
