var Crawler = require('simplecrawler');
// var SiteService = require('./services/sites.js');
var Site = require('./Site.js');

var currCrawls = {};

module.exports.isCrawling = function(url) {
    return currCrawls.hasOwnProperty(url) ? true : false;
};

module.exports.crawl = function(host, config, onComplete) {

    console.log('crawl', host, config);

    currCrawls[host] = true;

    var host = host;

    var myCrawler = new Crawler(host);

    myCrawler.initialProtocol = config.initialProtocol || 'http';
    myCrawler.initialPath = config.initialPath || '/';
    myCrawler.initialPort = parseInt(config.initialPort) || 20;
    myCrawler.interval = parseInt(config.interval) || 250;
    myCrawler.maxConcurrency = parseInt(config.maxConcurrency) || 1;

    var site;

    myCrawler.on('crawlstart', function() { console.log('start'); site = new Site(host); });

    myCrawler.on('fetchstart', function(queueItem, requestOptions) {
        console.log('fetchstart');
        site.setlinksIndex(queueItem.url);
        site.addRequest(requestOptions);
    });

    myCrawler.on('fetchcomplete', function(queueItem, responseBuffer, response) {
        console.log('fetchcomplete');
        site.addResponse(queueItem.url, response);
    });

    // require('./db/connect');

    myCrawler.on('fetcherror', function(queueItem, response) {
        site.addResponse(queueItem.url, response);
    });

    myCrawler.on('complete', function() {
        site.findBrokenLinks();
        console.log('complete');
        onComplete(site);
        delete currCrawls[host];
    });

    myCrawler.start();
};

