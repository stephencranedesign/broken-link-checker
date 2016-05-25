var Crawler = require('simplecrawler');
var SiteService = require('./services/sites.js');

var myCrawler = new Crawler(url);

// var url = 'www.cernecalcium.com';

var url = 'www.localhost';
myCrawler.initialPort = 8080;

myCrawler.maxConcurrency = 1;
myCrawler.initialPath = '/';

var Site = function(url) {
    this.url = url;
    this.uId = 0;
    this.linksIndexMap = {};
    this.links = [];
};
Site.prototype.setlinksIndex = function(url) {
    this.linksIndexMap[url] = this.uId;
    this.uId++;
};
Site.prototype.getlinksIndex = function(url) {
    return this.linksIndexMap[url];
};
Site.prototype.addRequest = function(obj) {
    this.links.push(new ReqObj(obj));
};
Site.prototype.addResponse = function(url, res) {
    var index = this.getlinksIndex(url);
    this.links[index] = new ResObj(this.links[index], res);
};
Site.prototype.findBrokenLinks = function() {
    var brokenLinks = []
    this.links.forEach(function(elm) {
        var code = parseInt(elm.statusCode);
        if(code >= 400 || code === -1) {
            brokenLinks.push(elm);
        }
    });
    this.brokenLinks = brokenLinks;
};

var ReqObj = function(req) {
    this.fileType = null;
    this.fileName = this._buildUrl(req);
    this.refererUrl = req.headers.Referer;
    this.statusCode = -1;
};
ReqObj.prototype._buildUrl = function(reqObj) {
    var test = reqObj.agent.protocol+'//'+reqObj.host+reqObj.path;
    return test;
};

var ResObj = function(req, res) {
    this.fileType = res.headers['content-type'];
    this.fileName = req.fileName;
    this.refererUrl = req.refererUrl;
    this.statusCode = res.statusCode;
};

var site;

myCrawler.on('crawlstart', function() {
    // resetlinks();
    site = new Site(url);
});

myCrawler.on('fetchstart', function(queueItem, requestOptions) {
    site.setlinksIndex(queueItem.url);

    // setlinksIndex(queueItem.url);
    site.addRequest(requestOptions);
});

myCrawler.on('fetchcomplete', function(queueItem, responseBuffer, response) {
    site.addResponse(queueItem.url, response);
});

require('./db/connect');

myCrawler.on('fetcherror', function(queueItem, response) {
    site.addResponse(queueItem.url, response);
});

myCrawler.on('discoverycomplete', function(queueItem, resources) {
    // console.log('discoverycomplete: ', queueItem, resources);
});

myCrawler.on('complete', function() {
    site.findBrokenLinks();
    console.log('***do something', site.links, site.brokenLinks); 
   
    SiteService.save(site, function(res) {
        console.log('saved', res);
    }, function(err) {
        console.log('error: ', err);
    });
    
    console.log('finished');
});

myCrawler.start();

