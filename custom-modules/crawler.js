var Site = require('./Site.js').Site;
var SiteStatus = require('./Site.js').SiteStatus;
var Resource = require('./Site.js').Resource;
var SiteService = require("../services/sites.js");
var PagesService = require("../services/pages.js");
var ResourcesService = require("../services/resources.js");
var BrokenLinkCrawler = require('./simple-crawler-extensions.js').BrokenLinkCrawler;

var recursiveCheck = require("../custom-modules/utils").recursiveCheck;
var currCrawls = require("../custom-modules/CurrCrawls").currCrawls;
var scheduler = require('./scheduler');



function makeCrawler(host, config) {
    var crawler = new BrokenLinkCrawler({host: host, uniqueUrlsOnly: false });

    crawler.initialProtocol = config.initialProtocol || 'http';
    crawler.initialPath = config.initialPath || '/';
    if(config.port) crawler.port = parseInt(config.port);
    crawler.interval = parseInt(config.interval) || 250;
    crawler.maxConcurrency = parseInt(config.maxConcurrency) || 1;
    crawler.maxDepth = parseInt(config.maxDepth) || 0;
    crawler.filterByDomain = false;

    return crawler;
};

function crawl(user, host, config, onComplete) {

    var host = host;
    var myCrawler = makeCrawler(host, config);
    var crawlFrequency = config.crawlFrequency || 10080; // 7 days.
    var site;

    site = scheduler.getRegisteredSite(user, host);

    console.log('site: ', site);

    // currCrawls[user+"::"+host] = site;
    currCrawls.add(user, host, site, myCrawler);

    console.log('currCrawls::: ', currCrawls);

    myCrawler.on('crawlstart', function() { 
        site.crawlStarted();
        console.log('start'); 
    });

    myCrawler.addFetchCondition(function(queueItem, referrerQueueItem) {
        console.log('addFetchCondition 2', myCrawler.host);
        console.log('queueItem: ', queueItem);
        console.log('referrerQueueItem: ', referrerQueueItem);

        // requesting resource from same domain as page resource was found on.
        if(queueItem.host === referrerQueueItem.host) {
            console.log('resource host is same as referrer host');

            // the referrer page host is not the crawler host.
            if(queueItem.host != myCrawler.host && referrerQueueItem.host != myCrawler.host) {
                console.log('referrer page host is not crawler host.')
                return false;
            }
            // else return true;
            else { // the referrer page host is the crawler host.

                console.log('referrer page host is crawler host.')
                // get the link if it is not already added to the goodResources object.
                if(!myCrawler.goodResources.hasOwnProperty(queueItem.path)) return true;

                // if it is on the object, call shouldFetch to see if it is a redirect or a downloaded.
                return myCrawler.goodResources[queueItem.path].shouldFetch();
            }
        }

        // requesting resource from different domain the page resource was found on.
        else if(referrerQueueItem.host != myCrawler.host) return false;

        // download.
        else return true;
    });

    myCrawler.on('fetchstart', function(queueItem, requestOptions) {
        console.log('fetchstart: ', queueItem);
        site.fetchStart(queueItem);
    });

    myCrawler.on('fetchheaders', function(queueItem, responseObject) {
        site.status.updateProcessResources();
        myCrawler.processHeader(responseObject);
    });

    myCrawler.on('fetchtimeout', function(queueItem, crawlerTimeoutValue) {
        site.fetchTimeout(queueItem, crawlerTimeoutValue);
    });

    myCrawler.on('discoverycomplete', function(queueItem, resources) {
        console.log('discoverycomplete: ', resources);
        site.status.updateTotalResources(myCrawler.queue.length);
    });

    myCrawler.on('complete', function() {
        site.crawlFinished();
        scheduler.updateRegisteredSite(site);
        if(isInUpdateQueue(site.url)) removeFromUpdateQueue(site);
        onComplete(site);
        // delete currCrawls[user+"::"+host];
        currCrawls.delete(user, host);
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
        user = update.user,
        path = update.path,
        callback = update.callback,
        errback = update.errback;

    SiteService.findSite(user, host, function(siteFromDb) {

        var resourcesRemoved = -1;
        siteFromDb = siteFromDb.site;

        nukeResourcesForPage(host, path, function() {
            resourcesRemoved = 1;
        }, function() {
            resourcesRemoved = 0;
        });

        siteFromDb.crawlOptions.maxDepth = 2;
        siteFromDb.crawlOptions.initialPath = path;
        siteFromDb.crawlOptions.crawlType = 'update-page';

        crawl(host, siteFromDb.crawlOptions, function(site) {
            console.log('site: ', site.pages);

            recursiveCheck(function() {
                return resourcesRemoved != -1 ? true : false;
            }).then(function() {
                if(!resourcesRemoved) throw new Error("error nuking resources");
                else {
                    callback(site);
                    updateComplete();
                }
            });
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

function updatePage(user, host, path, callback, errback) {

    addUpdateToQueue({ host: host, path: path, callback: callback, errback: errback });

    /* 
        kill if the site is currently getting a full-site crawl. 
            - will this update run once full-site crawl complete? 
            - do i really want this?
                - unitypoint takes a day to run.. I think i'd want to run the updatePage even if the full site is being crawled.
                - maybe I add a timestamp to every page? then when full site is crawled, i do a check between what was just crawled and what is in the database. If a page in the database has a more recent time stamp then what is in the crawl, use that.
    */
    if(currCrawls.isCrawlingSite(user, host)) {
        var siteStatus = currCrawls.getStatus(user, host);
        if(siteStatus.crawlType === 'full-site') return;
    }

    processNextUpdateInQueue();
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

function nukeResourcesForPage(user, host, path, callback, errback) {

    // get page
    PagesService.listForSiteByPath(user, host, path, function(doc) {
        console.log('doc: ', doc);
        // nuke resources.
        ResourcesService.nukeResourcesForPage(user, doc[0].resources, function() {
            callback();
        }, function(err) {
            errback(err);
        });

    }, function(err) {
        errback(err);
    });
};

function setUpdatesNeededForPage(site) {

};

module.exports.currCrawls = currCrawls;
module.exports.crawl = crawl;
module.exports.updatePage = updatePage;

