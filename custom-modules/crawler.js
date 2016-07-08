var Crawler = require('simplecrawler');
var cheerio = require('cheerio');
var Site = require('./Site.js');
var loopObj = require('./utils.js').loopObj;

var currCrawls = {};

function crawl(host, config, onComplete) {

    console.log('config: ', config);

    currCrawls[host] = true;
    var host = host;
    var myCrawler = new Crawler(host);
    var crawlFrequency = config.crawlFrequency || 10080; // 7 days.

    myCrawler.discoverResources = function(buffer, queueItem) {
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

    myCrawler.initialProtocol = config.initialProtocol || 'http';
    myCrawler.initialPath = config.initialPath || '/';
    myCrawler.initialPort = parseInt(config.initialPort) || 20;
    myCrawler.interval = parseInt(config.interval) || 250;
    myCrawler.maxConcurrency = parseInt(config.maxConcurrency) || 1;

    var site;

    myCrawler.on('crawlstart', function() { 
        console.log('start'); 
        site = new Site(host, crawlFrequency, config); 
    });

    myCrawler.on('fetchstart', function(queueItem, requestOptions) {
        site.fetchStart(queueItem);
    });

    myCrawler.on('fetchtimeout', function(queueItem, crawlerTimeoutValue) {
        site.fetchTimeout(queueItem, crawlerTimeoutValue);
    });

    myCrawler.on('complete', function() {
        site.processLinks();
        onComplete(site);
        delete currCrawls[host];
    });

    myCrawler.start();
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

function mockCrawler(stub) {
    Crawler = stub;
};

module.exports.currCrawls = currCrawls;
module.exports.isCrawling = isCrawling;
module.exports.crawl = crawl;
module.exports.isIdle = isIdle;

/* for tests */
module.exports.mockCrawler = mockCrawler;