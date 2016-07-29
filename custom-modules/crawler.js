var Site = require('./Site.js').Site;
var SiteStatus = require('./Site.js').SiteStatus;
var Resource = require('./Site.js').Resource;
var loopObj = require('./utils.js').loopObj;
var SiteService = require("../services/sites.js");
var BrokenLinkCrawler = require('./simple-crawler-extensions.js').BrokenLinkCrawler;

var currCrawls = {};


function makeCrawler(host, config) {
    var crawler = new BrokenLinkCrawler({host: host, uniqueUrlsOnly: false });

    crawler.initialProtocol = config.initialProtocol || 'http';
    crawler.initialPath = config.initialPath || '/';
    crawler.initialPort = parseInt(config.initialPort) || 20;
    crawler.interval = parseInt(config.interval) || 250;
    crawler.maxConcurrency = parseInt(config.maxConcurrency) || 1;
    crawler.maxDepth = parseInt(config.maxDepth);

    return crawler;
};

function crawl(host, config, onComplete) {

    var host = host;
    var myCrawler = makeCrawler(host, config);
    var crawlFrequency = config.crawlFrequency || 10080; // 7 days.

    var site = new Site(host, crawlFrequency, config); 
    var siteStatus = new SiteStatus(config.crawlType);

    currCrawls[host] = siteStatus;

    myCrawler.on('crawlstart', function() { 
        site.crawlStarted();
        console.log('start'); 
    });

    myCrawler.addFetchCondition(function(parsedURL, queueItem) {
        console.log('addFetchCondition: ', this.goodResources.hasOwnProperty(parsedURL.path));

        // get the link if it is not already added to the goodResources object.
        if(!this.goodResources.hasOwnProperty(parsedURL.path)) return true;

        // if it is on the object, call shouldFetch to see if it is a redirect or a downloaded.
        return this.goodResources[parsedURL.path].shouldFetch();
    }.bind(myCrawler));

    myCrawler.on('fetchstart', function(queueItem, requestOptions) {
        site.fetchStart(queueItem);
    });

    myCrawler.on('fetchheaders', function(queueItem, responseObject) {
        siteStatus.updateProcessResources();
        myCrawler.processHeader(responseObject);
    });

    myCrawler.on('fetchtimeout', function(queueItem, crawlerTimeoutValue) {
        site.fetchTimeout(queueItem, crawlerTimeoutValue);
    });

    myCrawler.on('discoverycomplete', function(queueItem, resources) {
        siteStatus.updateTotalResources(myCrawler.queue.length);
    });

    myCrawler.on('complete', function() {
        site.crawlFinished();
        if(isInUpdateQueue(site.url)) removeFromUpdateQueue(site);
        onComplete(site);
        delete currCrawls[host];
    });

    myCrawler.start();
};

/*
    if a good link is found. we dont care where it comes from on the site so we can ignore it and not add it to the queue for the rest of the crawl.
*/

function processHeader() {
    var crawler = this;
    return function(responseObject) {
        console.log('*****');
        console.log('responseObject: ', responseObject);

        // was an error.
        if(responseObject.statusCode > 399) return;

        // is a redirect
        else if(responseObject.statusCode > 299 && responseObject.statusCode < 400) {
            // redirecting to error page..
            if(/\/404\.aspx\?aspxerrorpath=\//.test(responseObject.headers.location)) return;
            crawler.goodLinkFound(responseObject);
        }

        // successfully downloaded
        else if(responseObject.statusCode > 199 && responseObject.statusCode < 300) crawler.goodLinkFound(responseObject);
    };
};

function isCrawling(url) {
    return currCrawls.hasOwnProperty(url) ? true : false;
};

/*
    returns number of sites currently indexing.
*/
function isIdle() {
    var idle = true;
    loopObj(currCrawls, function() {
        idle = false;
    });
    return idle;
};

/* 
    updating.. 
    not sure if this is even doable.. 
    maybe check to make sure we can post to some urls publicly but not all urls? 

    the thougtht is to be able to have the backend hit an endpoint for a page that has just been updated and then do a crawl of that page and update the site info for that page.
    not sure if we can make this work so that anyone can call this endpoint but not the register/unregister endpoints..
*/
var updateQueue = [];
function addUpdateToQueue(obj) {
    updateQueue.push(obj);
};

function processNextUpdateInQueue() {

    var update = updateQueue[0],
        host = update.host,
        path = update.path,
        callback = update.callback,
        errback = update.errback;

    SiteService.findSite(host, function(siteFromDb) {
        // console.log('update: ', host, path, siteFromDb);

        var freshSite = new Site(host, siteFromDb.crawlFrequency, siteFromDb.crawlOptions);

        var referrerToRemove = siteFromDb.crawlOptions.initialProtocol+ '://www.' +siteFromDb.url+path
        freshSite.resources = removeLinksForReferrer(siteFromDb, referrerToRemove);
        console.log('site.resources: ', freshSite.resources.length);

        siteFromDb.crawlOptions.maxDepth = 2;
        siteFromDb.crawlOptions.initialPath = path;
        siteFromDb.crawlOptions.crawlType = 'update-page';

        // console.log('config for update: ', siteFromDb.crawlOptions);

        crawl(host, siteFromDb.crawlOptions, function(pageInfo) {
            // console.log('pageInfo: ', pageInfo);

            pageInfo.flattenLinks();
            console.log('yo2: ', pageInfo.resources.length);
            console.log(pageInfo.resources);

            freshSite.resources = freshSite.resources.concat(pageInfo.resources);
            freshSite.crawlFinished('update-page');

            /* keep values for full site crawl for these */
            freshSite.date = siteFromDb.date;
            freshSite.crawlDurationInSeconds = siteFromDb.crawlDurationInSeconds;

            // console.log('boom', freshSite);
            callback(freshSite);
            updateComplete();
        }, function(err) {
            errback(err);
        });
    }, function(err) {
        errback(err);
    });
};

function updateComplete() {
    // remove first item.
    updateQueue.shift();
    if(!updateQueue.length) return;
    processNextUpdateInQueue();
}

function update(host, path, callback, errback) {

    addUpdateToQueue({ host: host, path: path, callback, errback });

    if(isCrawling(host)) {
        var siteStatus = currCrawls[host];
        siteStatus.crawlType === 'full-site'
        return;
    }

    processNextUpdateInQueue();
};

function removeLinksForReferrer(site, path) {
    var array = [];
    var links = site.brokenLinks.concat(site.downloadedLinks).concat(site.redirectedLinks);
    console.log('links length before removing for path: ', links.length);
    links.forEach(function(resource) {
        console.log('removeLinksForReferrer', resource.referrer != path, resource.referrer, path);
        if(resource.referrer != path) array.push(resource)
    });

    return array;
};

function isInUpdateQueue(url) {
    if(!updateQueue.length) return false;

    var index = -1;
    // is this site in the update queue?
    updateQueue.forEach(function(siteFromUpdateQueue, i) {
        if(siteFromUpdateQueue.host === url) index = 1;
    });

    return index;
};
function removeFromUpdateQueue(index) {
    // remove from update queue.
    if(index != -1) updateQueue.splice(index, 1);
}

function mockCrawler(stub) {
    Crawler = stub;
};

module.exports.currCrawls = currCrawls;
module.exports.isCrawling = isCrawling;
module.exports.crawl = crawl;
module.exports.isIdle = isIdle;
module.exports.update = update;

module.exports.removeLinksForReferrer = removeLinksForReferrer;

