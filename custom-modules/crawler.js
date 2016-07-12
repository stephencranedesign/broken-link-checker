var Crawler = require('simplecrawler');
var cheerio = require('cheerio');
var Site = require('./Site.js').Site;
var SiteStatus = require('./Site.js').SiteStatus;
var loopObj = require('./utils.js').loopObj;
var SiteService = require("../services/sites.js");

var currCrawls = {};

function crawl(host, config, onComplete) {

    var host = host;
    var myCrawler = new Crawler(host);
    var crawlFrequency = config.crawlFrequency || 10080; // 7 days.

    var site = new Site(host, crawlFrequency, config); 
    var siteStatus = new SiteStatus(config.crawlType);

    currCrawls[host] = siteStatus;

    myCrawler.discoverResources = discoverResources;

    myCrawler.initialProtocol = config.initialProtocol || 'http';
    myCrawler.initialPath = config.initialPath || '/';
    myCrawler.initialPort = parseInt(config.initialPort) || 20;
    myCrawler.interval = parseInt(config.interval) || 250;
    myCrawler.maxConcurrency = parseInt(config.maxConcurrency) || 1;
    if(config.maxDepth) myCrawler.maxDepth = config.maxDepth;

    var site;

    myCrawler.on('crawlstart', function() { 
        site.crawlStarted();
        console.log('start'); 
    });

    myCrawler.on('fetchstart', function(queueItem, requestOptions) {
        site.fetchStart(queueItem);
    });

    myCrawler.on('fetchheaders', function(queueItem, responseObject) {
        siteStatus.updateProcessLinks();
    });

    myCrawler.on('fetchtimeout', function(queueItem, crawlerTimeoutValue) {
        site.fetchTimeout(queueItem, crawlerTimeoutValue);
    });

    myCrawler.on('discoverycomplete', function(queueItem, resources) {
        console.log('discoverycomplete: ');
        siteStatus.updateTotalLinks(myCrawler.queue.length);
    });

    myCrawler.on('complete', function() {
        site.crawlFinished();
        onComplete(site);
        delete currCrawls[host];
    });

    myCrawler.start();
};

function discoverResources(buffer, queueItem) {
    var $ = cheerio.load(buffer.toString("utf8"));

    var resources = [];
 
    /* page links */
    $("a[href]").map(function () {
        var href = $(this).attr('href');

        /* has a hash -> shouldn't have to worry about a hash url and it causes an error */
        if(/#/.test(href)) return;

        resources.push(href);
    }).get();

    /* imgs */
    $("img[src]").map(function () {
        resources.push($(this).attr("src"));
    }).get();

    /* scripts */
    $("scripts[href]").map(function () {
        resources.push($(this).attr("href"));
    }).get();

    /* styles */
    $("link[rel='stylesheet']").map(function () {
        resources.push($(this).attr("href"));
    }).get();

    return resources;
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
var currUpdates = {};
function isUpdating(host) { return currUpdates.hasOwnProperty(host) ? true : false; };
function addUpdateToQueue(obj) {
    updateQueue.push(obj);
};

function update(host, path, site, callback, errback) {
    addUpdateToQueue({ host: host, path: path });

    if(isUpdating(host)) return;
    else {
        currUpdates[host] = true;
        processUpdateQueue()
    }
    SiteService.findSite(host, function(site) {
        console.log('update: ', host, path, site);

        site.links = removeLinksForPath(site.links, path);
        console.log('site.links: ', site.links);

        crawl(host, { maxDepth: 1, initialPath: path }, function(pageInfo) {
            console.log('pageInfo: ', pageInfo);

            site.links = site.links.concat(pageInfo.links);

            var dontProcessTime = true;
            site.crawlFinished(dontProcessTime);

            callback(site);
        }, function(err) {
            errback(err);
        });
    }, function(err) {
        res.json({ message: 'site not found', err: err })
    });
};

function removeLinksForPath(links, path) {
    var array = [];
    links.forEach(function(resource) {
        if(resource.referrer != resource.host + path) array.push(resource)
    });
    return array;
};

function mockCrawler(stub) {
    Crawler = stub;
};

module.exports.currCrawls = currCrawls;
module.exports.isCrawling = isCrawling;
module.exports.crawl = crawl;
module.exports.isIdle = isIdle;
module.exports.update = update;

var FakeSite = function() {
    this.actualLinks = [];
    this.links = [];
};
FakeSite.prototype.addFakeLink = function(FakeLink) { this.links.push(FakeLink); };
FakeSite.prototype.process = function() {
    this.links.forEach(function(link) {
        this.actualLinks.push(link);
    }.bind(this));

    this.brokenLinks = [new FakeLink(), new FakeLink(), new FakeLink(), new FakeLink()];
    this.redirectLinks = [new FakeLink(), new FakeLink(), new FakeLink(), new FakeLink()];
};

var FakeLink = function() {
    this.depth = 1;
    this.fetched = true;
    this.host = "cernecalcium.com";
    this.path = '/';
    this.port = 90;
    this.protocol = 'http';
    this.stateData = {
        code: 301,
        contentLength: 151,
        contentType: "text/html; charset=UTF-8",
        headers: {
            connection: "close",
            contentLength: "151",
            contentType: "text/html; charset=UTF-8",
            date: "Mon, 11 Jul 2016 21:57:17 GMT",
            location: "http://www.cernecalcium.com/",
            server: "Microsoft-IIS/8.5",
            "x-powered-by": "ASP.NET"
        },
        requestLatency: 121,
        requestTime: 121
    };
};

module.exports.explode = function(callback) {
    var Site = new FakeSite;
    var i = 399500;
    while ( i > 0 ) {
        console.log(i);
        Site.addFakeLink(new FakeLink());
        i--;
    };
    Site.process();
    callback(Site);
};

/* for tests */
module.exports.mockCrawler = mockCrawler;