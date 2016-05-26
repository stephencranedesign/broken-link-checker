var Crawler = require('simplecrawler');
var SiteService = require('./services/sites.js');
var Site = require('./custom-modules/Site.js');

var url = 'www.cernecalcium.com';

var myCrawler = new Crawler(url);

// myCrawler.url = 'localhost';
// myCrawler.initialPort = 8080;

myCrawler.maxConcurrency = 1;
myCrawler.initialPath = '/';

var site;

myCrawler.on('crawlstart', function() { site = new Site(url); });

myCrawler.on('fetchstart', function(queueItem, requestOptions) {
    site.setlinksIndex(queueItem.url);
    site.addRequest(requestOptions);
});

myCrawler.on('fetchcomplete', function(queueItem, responseBuffer, response) {
    site.addResponse(queueItem.url, response);
});

require('./db/connect');

myCrawler.on('fetcherror', function(queueItem, response) {
    site.addResponse(queueItem.url, response);
});

// myCrawler.on('discoverycomplete', function(queueItem, resources) {
//     // console.log('discoverycomplete: ', queueItem, resources);
// });

myCrawler.on('complete', function() {

    site.findBrokenLinks();
   
    SiteService.save(site, function(res) {
        console.log('saved', res);
    }, function(err) {
        console.log('error: ', err);
    });
});

myCrawler.start();

