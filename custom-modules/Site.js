var capDecimals = require('./utils.js').capDecimals;
var loopObj = require('./utils.js').loopObj;
var Page = require('./Page');
var Resource = require('./Resource');
var ObjectID = require('mongodb').ObjectID;
var registeredSites = require('./scheduler.js').registeredSites;

/*
    Description of the site. this is what we eventually send to Db to save info.
*/
var Site = function(url, crawlFrequency, crawlOptions) {
    this.url = url;

    this.fetchTimeouts = [];
    this.resources = [];
    this.queue = [];
    this.redirectedResources = [];
    this.brokenResources = [];
    this.downloadedResources = [];

    this.crawlFrequency = crawlFrequency;
    this.crawlOptions = crawlOptions;
    this.processedGoodResources = {};
    this.crawlType = crawlOptions.hasOwnProperty('crawlType') ?  crawlOptions.crawlType : 'full-site';
};
Site.prototype.fetchStart = function(queueItem) { 
    this.queue.push(queueItem);
};
Site.prototype.fetchTimeout = function(queueItem) {
    this.fetchTimeouts.push(queueItem);
};
Site.prototype.crawlStarted = function() {
    if(this.crawlType === 'page-update') return;
    this.crawlStartTime = Date.now();
};
Site.prototype.crawlFinished = function(type) {
    if(type != undefined) this.crawlType = type;
    this._processQueue();
    this._processResources();
    this._groupByPages();
    this.processedGoodResources = null; // free some space.
    if(this.crawlType === 'page-update') return;
    this.crawlEndTime = Date.now();
    this.crawlDurationInSeconds = capDecimals((this.crawlEndTime - this.crawlStartTime) / 1000, 2);
};

/*
    look at resource/stateData to determine if the resource is broken.
*/ 
Site.prototype._isBrokenResource = function(resource) {
    var brokenResource = false;
    if(resource.status === "notfound" || resource.status === "failed") brokenResource = true;

    console.log('crawlType: ', this.crawlType);
    if( this.crawlType === "full-site" ) {
        // 404 error page
        if(resource.status === "redirected" && /\/404\.aspx\?aspxerrorpath=\//.test(resource.stateData.headers.location)) brokenResource = true;
    }
    else {
        // 404 error page
        if(resource.status === "redirected" && /\/404\.aspx\?aspxerrorpath=\//.test(resource.locationFromHeader)) brokenResource = true;
    }

    return brokenResource;
};

/*
    weed out duplicate good links in queue and assign it to resources array.
*/
Site.prototype._processQueue = function() {
    var processedResources = {};
    var array = [];
    this.queue.forEach(function(queueItem) {

        console.log("processQueue in Loop: ", queueItem.path, " | ",processedResources.hasOwnProperty(queueItem.path), " | ", !this._isBrokenResource(queueItem) , " | ", queueItem.status);
        
        // check if we've processed this link.
        if(processedResources.hasOwnProperty(queueItem.path)) return;
        var isBroken = this._isBrokenResource(queueItem);
        array.push(new Resource(this.url, isBroken, queueItem));

        // only add to processedResources if it is not a broken link.
        if(!isBroken) processedResources[queueItem.path] = true;
    }.bind(this));

    console.log("after loop: ", array);

    this.queue = []; // attempt to free some space for massive sites.
    this.resources = array;
};

/*
    look through resources and assign each to one these arrays of:
        - brokenResources
        - redirectedResources
        - downloadedResources
*/
Site.prototype._processResources = function() {
    console.log('crawlType from _processResources: ', this.crawlType);
    this.resources.forEach(function(resource) {
        console.log("resource: ", resource);
        // if(this.crawlType === 'full-site') {

            // broken Resources
            if(this._isBrokenResource(resource.info)) this.brokenResources.push(resource);

            // redirect Resources
            else if(resource.info.status === "redirected") {
                if(this.alreadyProcessed(resource.info.url)) return;
                this.redirectedResources.push(resource);
            }

            // downloaded Resources
            else if( resource.info.status === "downloaded" ) {
                if(this.alreadyProcessed(resource.info.url)) return;
                this.downloadedResources.push(resource);
            }
        // }
        // else {
        //      // broken Resources
        //     if(this._isBrokenResource(resource.info)) this.brokenResources.push(resource);

        //     // redirect Resources
        //     else if(resource.info.status === "redirected") {
        //         this.redirectedResources.push(resource);
        //     }

        //     // downloaded Resources
        //     else if( resource.info.status === "downloaded" ) {
        //         this.downloadedResources.push(resource);
        //     }
        // }

    }.bind(this));
};
Site.prototype.alreadyProcessed = function(url) {
    if(this.processedGoodResources[url]) return true;
    this.processedGoodResources[url] = true;
    return false;
};

/*
    create a pages object and sort through all resources to assign to a specific page.
*/
Site.prototype._groupByPages = function() {
    var pages = {}, array = [];
    this.resources.forEach(function(resource) {

        // if no referer, then its the entry point and we dont need to worry about that.
        if(!resource.info.hasOwnProperty("referrer")) return;

        var path = resource.info.referrer;

        // page exists
        if(pages.hasOwnProperty(path)) {
            var page = pages[path];
            page.resources.push(resource._id);
        }
        else { // new page
            var page = new Page(this.url, path);
            page.resources.push(resource._id);
            pages[path] = page;
        }
    }.bind(this));

    loopObj(pages, function(key, val) {
        array.push(val);
    });

    this.pages = array;
};

/*
    Snap shot of site crawling progress. Stored on server and given to client when status is requested.
*/
var SiteStatus = function(crawlType) {
    this.totalResources = 0;
    this.processedResources = 0;
    this.percentComplete = 0;
    this.crawlType = crawlType || 'full-site';
};
SiteStatus.prototype.updateProcessResources = function() { 
    this.processedResources++; 
    this.updatePercentComplete(); 
};
SiteStatus.prototype.updateTotalResources = function(length) { 
    this.totalResources = length; 
    this.updatePercentComplete(); 
};
SiteStatus.prototype.updatePercentComplete = function() { 
    this.percentComplete = capDecimals(this.processedResources/this.totalResources, 2); 
};

module.exports.Site = Site;
module.exports.SiteStatus = SiteStatus;
