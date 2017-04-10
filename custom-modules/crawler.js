var Site = require('./Site.js').Site;
var SiteStatus = require('./Site.js').SiteStatus;
var Resource = require('./Site.js').Resource;
var SiteService = require("../services/sites.js");
var BrokenLinkCrawler = require('./simple-crawler-extensions.js').BrokenLinkCrawler;

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
    sites.setCrawling(user, host, true);

    currCrawls.add(user, host, myCrawler);

    myCrawler.on('complete', function() {
        // var info = myCrawler.crawlComplete.call(myCrawler);
        myCrawler.whitelistedUrls = site.whitelistedUrls;

        var crawlReport = myCrawler.getCrawlReport();

        site.crawlFinished(crawlReport);
        sites.updateRegistered(site);
        currCrawls.delete(user, host);
        sites.setCrawling(user, host, false);
        onComplete(site);
    });

    myCrawler.start();
};

module.exports.crawl = crawl;

