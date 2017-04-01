var Site = require('./Site.js').Site;
var SiteStatus = require('./Site.js').SiteStatus;
var Resource = require('./Site.js').Resource;
var SiteService = require("../services/sites.js");
var ResourcesService = require("../services/resources.js");
var BrokenLinkCrawler = require('./simple-crawler-extensions.js').BrokenLinkCrawler;

var recursiveCheck = require("../custom-modules/utils").recursiveCheck;
var currCrawls = require("../custom-modules/CurrCrawls").currCrawls;
var sites = require('./sites');



function makeCrawler(host, config) {
    var crawler = new BrokenLinkCrawler({ host: host });

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

    site = sites.getRegistered(user, host);

    currCrawls.add(user, host, site, myCrawler);

    myCrawler.on('crawlstart', function() { 
        site.crawlStarted();
        console.log('start'); 
    });

    myCrawler.on('fetchstart', function(queueItem, requestOptions) {
        site.fetchStart(queueItem);
    });

    myCrawler.on('fetchheaders', function(queueItem, responseObject) {
        site.status.updateProcessResources();
    });

    myCrawler.on('discoverycomplete', function(queueItem, resources) {
        console.log('discoverycomplete: ', queueItem.url, resources);
        site.makePage({ url: queueItem.url, path: queueItem.path, resources: resources });

        site.status.updateTotalResources(myCrawler.queue.length);
    });

    myCrawler.on('complete', function() {
        console.log('## complete ##');
        console.log(myCrawler.pages);
        console.log('####');
        site.crawlFinished();
        sites.updateRegistered(site);
        onComplete(site);
        currCrawls.delete(user, host);
    });

    myCrawler.start();
};

module.exports.crawl = crawl;

