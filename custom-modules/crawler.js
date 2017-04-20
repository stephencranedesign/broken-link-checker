var Site = require('./Site.js').Site;
var SiteStatus = require('./Site.js').SiteStatus;
var Resource = require('./Site.js').Resource;
var SiteService = require("../services/sites.js");
var BrokenLinkCrawler = require('./simple-crawler-extensions.js').BrokenLinkCrawler;

var Resource = require('./Resource');

var currCrawls = require("../custom-modules/CurrCrawls").currCrawls;
var sites = require('./sites');

var OffendersList = require('./Offenders').List;
var Offender = require('./Offenders').Offender;

var Promise = require('bluebird');


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

    sites.setCrawling(user, host, true);

    currCrawls.add(user, host, myCrawler);

    console.log('crawl: ', user, host, config);

    myCrawler.on('complete', function() {

        var crawlReport = myCrawler.getCrawlReport();

        crawlFinished(user, host, crawlReport)
            .then(function(report) {
                currCrawls.delete(user, host);
                sites.setCrawling(user, host, false);
                onComplete(report);
            });
    });

    myCrawler.start();
};

// move stuff from site to here.

function crawlFinished(user, host, crawlReport) {

    // get whiteListedUrls
    return SiteService.findOne({ user: user, host: host })
        .then(function(site) {

            console.log('site: ', site);

            var whitelistedUrls = site.crawlOptions.whitelistedUrls || [];

            console.log('whitelistedUrls: ', whitelistedUrls);

            crawlReport.brokenResources = getBrokenResources(user, host, whitelistedUrls, crawlReport.badUrls);
            crawlReport.worstOffenders = findWorstOffenders(crawlReport.brokenResources);

            return crawlReport;
        });
};

function getBrokenResources(user, host, whitelistedUrls, badUrls) {
    var brokenResources = [];

    badUrls.forEach((badUrl) => {
        if(isWhiteListed(whitelistedUrls, badUrl.url)) badUrl.whiteListed = true;
        var resource = new Resource(user, host, badUrl);
        brokenResources.push(resource);
    });

    return brokenResources;
};

/*
    pass either an array of urls or a single url to add to whiteList array.
    @return void
*/
// Site.prototype.whiteListAddUrl = function(url) {
//     if(typeof url.forEach === "function") { // check to see if it's an array.
//         var array = [];

//         // ensure whitelist stays unique.
//         url.forEach(function(val) {
//             if(array.indexOf(val) > -1) return;
//             if(this.whitelistedUrls.indexOf(val) > -1) return;
//             array.push(val);
//         }.bind(this));

//         this.whitelistedUrls = this.whitelistedUrls.concat(array);
//         this.crawlOptions.whitelistedUrls = this.whitelistedUrls;
//     }
//     else {

//         // ensure whitelist stays unique.
//         if(this.whitelistedUrls.indexOf(url) > -1) return;
//         this.whitelistedUrls.push(url);
//         this.crawlOptions.whitelistedUrls = this.whitelistedUrls;
//     }
// };

function findWorstOffenders(brokenResources) {
    
    var array = brokenResources.filter(function(resource) {
        return !resource.whiteListed;
    });

    console.log('_findWorstOffenders: ', array);
    var worstOffenders = new OffendersList(array);
    worstOffenders.sortByProp('length', true);
    return worstOffenders.array.slice(0,5);
}; 

/*
    compares url with whitelisted urls.
    @return bool
*/
function isWhiteListed(whiteListArray, url) {
    var isWhiteListed = false;
    if( whiteListArray.indexOf(url) > -1 ) isWhiteListed = true;

    return isWhiteListed;
};


module.exports.crawl = crawl;

