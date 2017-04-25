/*
    the glue between crawler controller and the BrokenLink crawler together.
*/

var Site = require('./Site.js').Site;
var SiteStatus = require('./Site.js').SiteStatus;
var Resource = require('./Site.js').Resource;
var SiteService = require("../services/sites.js");
var ResourcesService = require("../services/resources.js");
var BrokenLinkCrawler = require('./simple-crawler-extensions.js').BrokenLinkCrawler;

var Resource = require('./Resource');

var currCrawls = require("../custom-modules/CurrCrawls").currCrawls;
var sites = require('./sites');

var OffendersList = require('./Offenders').List;
var Offender = require('./Offenders').Offender;

var Promise = require('bluebird');


function makeCrawler(host, crawlOptions) {
    var crawler = new BrokenLinkCrawler({ host: host, combInterval: 500 });

    crawler.initialProtocol = crawlOptions.initialProtocol || 'http';
    crawler.initialPath = crawlOptions.initialPath || '/';
    if(crawlOptions.port) crawler.port = parseInt(crawlOptions.port);
    crawler.interval = parseInt(crawlOptions.interval) || 250;
    crawler.maxConcurrency = parseInt(crawlOptions.maxConcurrency) || 1;
    crawler.maxDepth = parseInt(crawlOptions.maxDepth) || 0;
    crawler.filterByDomain = false;

    return crawler;
};

function crawl(config) {

    var host = config.host;
    var myCrawler = makeCrawler(config.host, config.crawlOptions);
    var crawlFrequency = config.crawlOptions.crawlFrequency || 10080; // 7 days.

    sites.setCrawling(config.user, config.host, true);

    currCrawls.add(config.user, config.host, myCrawler);

    myCrawler.on('BrokenLinkCrawller::comb', function(crawlReport) {

        mergeReport(config.user, config.host, crawlReport)
            .then(function(report) {
                config.comb(report);
            });
    });

    myCrawler.on('BrokenLinkCrawller::complete', function(crawlReport) {

        mergeReport(config.user, config.host, crawlReport)
            .then(function(report) {
                currCrawls.delete(config.user, config.host);
                sites.setCrawling(config.user, config.host, false);
                config.complete(report);
            });
    });

    myCrawler.start();
};

/* gets info about site from & merge it with crawl report. */
function mergeReport(user, host, crawlReport) {

    crawlReport.user = user;
    crawlReport.host = host;

    // get site
    return SiteService.findOne({ user: user, host: host })
        
        .then(function(site) {

            // get whiteListedUrls from crawl
            var whitelistedUrls = site.crawlOptions.whitelistedUrls || [];
            crawlReport.brokenResources = brokenResourcesFromCrawl(user, host, whitelistedUrls, crawlReport.badUrls);

            // get brokenResource from db
            if(crawlReport.firstComb) return [];
            else return ResourcesService.find({ user: user, host: host, whiteListed: false });
        })

        .then(function(dbResources) {
            var brokenResources = crawlReport.brokenResources.concat(dbResources);
            // console.log('dbResources: ', dbResources);
            // console.log('crawlReport.brokenResources: ', crawlReport.brokenResources);
            // console.log('concat: ', brokenResources);

            crawlReport.worstOffenders = findWorstOffenders(brokenResources);
            console.log('worstOffenders: ', crawlReport.worstOffenders);
            return crawlReport;
        })

        .catch(function(err) {
            console.log('err during mergeReport: ', err);
        });
};

function brokenResourcesFromCrawl(user, host, whitelistedUrls, badUrls) {
    var brokenResources = [];

    badUrls.forEach((badUrl) => {
        if(isWhiteListed(whitelistedUrls, badUrl.url)) badUrl.whiteListed = true;
        var resource = new Resource(user, host, badUrl);
        brokenResources.push(resource);
    });

    return brokenResources;
};

function findWorstOffenders(brokenResources) {
    
    var array = brokenResources.filter(function(resource) {
        return !resource.whiteListed;
    });

    var worstOffenders = new OffendersList(array);
    worstOffenders.sortByProp('length', true);
    return worstOffenders.array.slice(0,5);
}; 

function isWhiteListed(whiteListArray, url) {
    var isWhiteListed = false;
    if( whiteListArray.indexOf(url) > -1 ) isWhiteListed = true;

    return isWhiteListed;
};


module.exports.crawl = crawl;

