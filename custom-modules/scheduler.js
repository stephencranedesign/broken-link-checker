/* use - https://www.npmjs.com/package/timer.js */
var Timer = require('timer.js');
var SiteService = require("../services/sites.js");
var loopObj = require('./utils.js').loopObj;

var crawlerCtrl = require("../controllers/crawler-controller");

/* Site Stub */
var SiteStub = function(site, callback) {
    this.url = site.url;
    this.crawlFrequency = site.crawlFrequency;
    this.lastCrawl = site.date || null;
    this.crawlOptions = site.crawlOptions;
    this.user = site.user;
    this.timer = new Timer();
    this.callback = callback || function() {};
    this.killed = false;
    this.pages = [];

    this.fillObj();
    this.startTimer();
};

/* allows us to save to db. */
SiteStub.prototype.fillObj = function() {
    this.brokenResources = [];
    this.date = new Date().toLocaleString();
    this.crawlDurationInSeconds = null;
    this.Resources = [null];
    this.downloadedResources = [null];
    this.brokenResources = [null];
    this.redirectedResources = [null];
    this.fetchTimeouts = [null];
};
SiteStub.prototype.startTimer = function() {
    this.timer.start(this.crawlFrequency).on('end', function() {
        if(this.killed) return;

        /* callback should call this.startTimer to resume. */
        this.callback.call(this);
    }.bind(this));
};
SiteStub.prototype.stopTimer = function() {
    this.killed = true;
    this.timer.stop();
};

var registeredSites = {};
var registerSite = function(site, saveToDb, callback, errback) {
    site = new SiteStub(site, site.callback);
    registeredSites[site.user+"::"+site.url] = site;

    /*
        siteStub should only be saved to db if it was hit by the endpoint.
        If we already have info for it on the db, we don't want to over-ride that info with the site stub..
    */

    // if( !saveToDb ) return callback(site);

    SiteService.save(site.user, site, function(doc) {
        console.log("saved to db from registerSite");
        if(callback) callback(site);
    }, function(err) {
        console.log("error trying to save to db from registerSite: ", err);
        if(errback) errback(err);
    });
};
function unRegisterSite(user, url, callback, errback) {
    if( isSiteRegistered(user,url) !== undefined ) {
        console.log('delete registered: ', url);
        registeredSites[user+"::"+url].stopTimer();
        delete registeredSites[user+"::"+url];
    }
    
    crawlerCtrl.unregisterSite(user, url, callback, errback);

    // crawlerCtrl.clearPagesAndResourcesForSite();
};

function isSiteRegistered(user, url) {
    return registeredSites.hasOwnProperty(user+"::"+url) ? true : false;
}

/*
    unregister all registered sites
*/
function flush(callback, errback) {
    crawlerCtrl.flush(callback, errback);
}

module.exports.SiteStub = SiteStub;
module.exports.registerSite = registerSite;
module.exports.unRegisterSite = unRegisterSite;
module.exports.registeredSites = registeredSites;
module.exports.flush = flush;
module.exports.isSiteRegistered = isSiteRegistered;
