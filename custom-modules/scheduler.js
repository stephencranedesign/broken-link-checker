/* use - https://www.npmjs.com/package/timer.js */
var Timer = require('timer.js');
var SiteService = require("../services/sites.js");
var loopObj = require('./utils.js').loopObj;

/* Site Stub */
var SiteStub = function(site, callback) {
    this.url = site.url;
    this.crawlFrequency = site.crawlFrequency;
    this.lastCrawl = site.date || null;
    this.crawlOptions = site.crawlOptions;
    this.timer = new Timer();
    this.callback = callback || function() {};
    this.killed = false;

    this.fillObj();
    this.startTimer();
};

/* allows us to save to db. */
SiteStub.prototype.fillObj = function() {
    this.brokenLinks = [];
    this.date = new Date().toLocaleString();
    this.links = [null];
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
    registeredSites[site.url] = site;

    /*
        siteStub should only be saved to db if it was hit by the endpoint.
        If we already have info for it on the db, we don't want to over-ride that info with the site stub..
    */

    if( !saveToDb ) return callback(site);

    SiteService.save(site, function(doc) {
        console.log("saved to db from registerSite");
        if(callback) callback(site);
    }, function(err) {
        console.log("error trying to save to db from registerSite: ", err);
        if(errback) errback(err);
    });
};
function unRegisterSite(url, callback, errback) {
    if( registeredSites[url] !== undefined ) {
        console.log('delete registered: ', url);
        registeredSites[url].stopTimer();
        delete registeredSites[url];
    }
    console.log('unRegisterSite: ', url, registeredSites);
    SiteService.remove(url, function(doc) {
        callback(doc);
    }, function(err) {
        errback(err);
    });
};

function isSiteRegistered(url) {
    return registeredSites.hasOwnProperty(url) ? true : false;
}

/*
    unregister all registered sites
*/
function flush(callback, errback) {
    SiteService.drop(function() {
        loopObj(registeredSites, function(site) {
            registeredSites[site.url].stopTimer();
            delete registeredSites[site.url];
        });
        callback();
    }, function(err) {
        errback(err);
    });
}

module.exports.SiteStub = SiteStub;
module.exports.registerSite = registerSite;
module.exports.unRegisterSite = unRegisterSite;
module.exports.registeredSites = registeredSites;
module.exports.flush = flush;
module.exports.isSiteRegistered = isSiteRegistered;
