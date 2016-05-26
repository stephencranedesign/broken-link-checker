var Crawler = require('simplecrawler');
// var SiteService = require('./services/sites.js');
var Site = require('./Site.js');

var crawlerOptions = [];

module.exports = function(host, config, onComplete) {
    var host = 'www.cernecalcium.com';

    var myCrawler = new Crawler(host);

    // myCrawler.host = 'localhost';
    // myCrawler.initialPort = 8080;

    myCrawler.maxConcurrency = 1;
    myCrawler.initialPath = '/';

    var site;

    myCrawler.on('crawlstart', function() { site = new Site(host); });

    myCrawler.on('fetchstart', function(queueItem, requestOptions) {
        site.setlinksIndex(queueItem.url);
        site.addRequest(requestOptions);
    });

    myCrawler.on('fetchcomplete', function(queueItem, responseBuffer, response) {
        site.addResponse(queueItem.url, response);
    });

    // require('./db/connect');

    myCrawler.on('fetcherror', function(queueItem, response) {
        site.addResponse(queueItem.url, response);
    });

    myCrawler.on('complete', function() {
        site.findBrokenLinks();
        onComplete(site);
    });

    myCrawler.start();
};

