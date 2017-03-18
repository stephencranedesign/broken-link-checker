var capDecimals = require('./utils.js').capDecimals;
var loopObj = require('./utils.js').loopObj;
var Page = require('./Page');
var Resource = require('./Resource');
var ObjectID = require('mongodb').ObjectID;
var registeredSites = require('./scheduler.js').registeredSites;
var TimerWrapper = require('./timerWrapper.js');

/*
    Description of the site. this is what we eventually send to Db to save info.
*/
var Site = function(user, url, crawlFrequency, crawlOptions) {
    this.url = url;

    this.fetchTimeouts = [];
    this.resources = [];
    this.queue = [];
    this.redirectedResources = [];
    this.brokenResources = [];
    this.downloadedResources = [];
    this.whitelistedUrls = crawlOptions.hasOwnProperty('whitelistedUrls') ?  crawlOptions.whitelistedUrls : [];
    this.user = user;

    this.crawlFrequency = crawlFrequency;
    this.crawlOptions = crawlOptions;
    this.processedGoodResources = {};
    this.crawlType = crawlOptions.hasOwnProperty('crawlType') ?  crawlOptions.crawlType : 'full-site';

    this.status = new SiteStatus(this.crawlType);
    this.timer = new TimerWrapper(crawlFrequency);

    console.log('site created: ', this.whitelistedUrls);
};
Site.prototype.fetchStart = function(queueItem) { 
    console.log('fetchStart: ', queueItem);
    this.queue.push(queueItem);
};
Site.prototype.fetchTimeout = function(queueItem) {
    this.fetchTimeouts.push(queueItem);
};
Site.prototype.crawlStarted = function() {
    this._logStage('crawlStarted');

    this.Resources = [];
    this.downloadedResources = [];
    this.brokenResources = [];
    this.redirectedResources = [];
    this.fetchTimeouts = [];
    this.processedGoodResources = {};
    
    if(this.crawlType === 'page-update') return;
    this.crawlStartTime = Date.now();
};
Site.prototype._logStage = function(stageName) {
    console.log('*****************************************');
    console.log('************** '+stageName+' ************');
    console.log('*****************************************');
};
Site.prototype.crawlFinished = function(type) {
    this._logStage('crawlFinished');
    if(type != undefined) this.crawlType = type;
    this._processQueue();
    this._processResources();
    this._groupByPages();
    this.processedGoodResources = null; // free some space.
    this._findWorstBrokenLinks();
    if(this.crawlType === 'page-update') return;
    this.crawlEndTime = Date.now();
    this.crawlDurationInSeconds = capDecimals((this.crawlEndTime - this.crawlStartTime) / 1000, 2);
};

/*
    compares url with whitelisted urls.
    @return bool
*/
Site.prototype._isWhiteListed = function(url) {
    var isWhiteListed = false;
    if( this.whitelistedUrls.indexOf(url) > -1 ) isWhiteListed = true;

    console.log("_isWhiteListed: ", isWhiteListed, url, this.whitelistedUrls.indexOf(url));
    return isWhiteListed;
};

/*
    pass either an array of urls or a single url to add to whiteList array.
    @return void
*/
Site.prototype.whiteListAddUrl = function(url) {
    if(typeof url.forEach === "function") { // check to see if it's an array.
        var array = [];

        // ensure whitelist stays unique.
        url.forEach(function(val) {
            if(array.indexOf(val) > -1) return;
            if(this.whitelistedUrls.indexOf(val) > -1) return;
            array.push(val);
        }.bind(this));

        this.whitelistedUrls = this.whitelistedUrls.concat(array);
        this.crawlOptions.whitelistedUrls = this.whitelistedUrls;
    }
    else {

        // ensure whitelist stays unique.
        if(this.whitelistedUrls.indexOf(url) > -1) return;
        this.whitelistedUrls.push(url);
        this.crawlOptions.whitelistedUrls = this.whitelistedUrls;
    }
};

/*
    look at resource/stateData to determine if the resource is broken.
    @return bool
*/ 
Site.prototype._isBrokenResource = function(queueItem) {
    var brokenResource = false;

    if(this._isWhiteListed(queueItem.url)) return brokenResource;

    if(queueItem.status === "notfound" || queueItem.status === "failed") brokenResource = true;

    if( this.crawlType === "full-site" ) {
        // 404 error page
        if(queueItem.status === "redirected" && /\/404\.aspx\?aspxerrorpath=\//.test(queueItem.stateData.headers.location)) brokenResource = true;
    }
    else {
        // 404 error page
        if(queueItem.status === "redirected" && /\/404\.aspx\?aspxerrorpath=\//.test(queueItem.locationFromHeader)) brokenResource = true;
    }

    // if(resource.badProtocol) {
    //     console.log('protocol mismatch: ', resource.protocol, this.crawlOptions.protocol);
    //     brokenResources = true;
    // }

    return brokenResource;
};

/*
    weed out duplicate good links in queue and assign it to resources array.
*/
Site.prototype._processQueue = function() {
    console.log('_processQueue: ');
    var processedResources = {};
    var array = [];
    this.queue.forEach(function(queueItem) {

        // console.log("processQueue in Loop: ", queueItem.path, " | ",processedResources.hasOwnProperty(queueItem.path), " | ", !this._isBrokenResource(queueItem) , " | ", queueItem.status);

        // check if we've processed this link.
        if(processedResources.hasOwnProperty(queueItem.path)) return;
        var isBroken = this._isBrokenResource(queueItem);
        array.push(new Resource(this.user, this.url, isBroken, queueItem));

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
        // console.log("resource: ", resource);
        // if(this.crawlType === 'full-site') {

            this.setResourceType(resource.info);

            /* add referrerPath: */
            if(resource.info.hasOwnProperty('referrer')) resource.info.referrerPath = resource.info.referrer.replace(this.crawlOptions.protocol+"://"+this.crawlOptions.host, "");

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

Site.prototype.setResourceType = function(resource) {
    var contentType = resource.stateData.contentType;
    if(/text/.test(contentType)) resource.type = 'text';
    else if(/image/.test(contentType)) resource.type = 'image';
    else if(/audio/.test(contentType)) resource.type = 'audio';
    else if(/video/.test(contentType)) resource.type = 'video';
    else if(/application/.test(contentType)) resource.type = 'application';
    else resource.type = null;
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

        // must be a 404 error page and we dont need to worry about that..
        if(/\/404.aspx?aspxerrorpath=/.test(resource.info.path)) return;

        var fullUrl = resource.info.referrer,
            path = this._getPathForResource(resource.info.referrer);

        console.log('_groupByPages: ', resource._id);
        // page exists
        if(pages.hasOwnProperty(fullUrl)) {
            var page = pages[fullUrl];
            page.resources.push(resource._id);
        }
        else { // new page
            var page = new Page(this.user, this.url, fullUrl, path);
            page.resources.push(resource._id);
            pages[fullUrl] = page;
        }
    }.bind(this));

    loopObj(pages, function(key, val) {
        array.push(val);
    });

    this.pages = array;
};
Site.prototype._getPathForResource = function(url) {
    return url.replace(url.split(':')[0]+'://www.'+this.url, "");
};

/*
    - looks through this.brokenResources array and finds the most frequent offenders
*/
Site.prototype._findWorstBrokenLinks = function() {
    console.log('_findWorstBrokenLinks: ', this.brokenResources);
    var worstOffenders = new OffendersList();
    this.brokenResources.forEach(function(resource) {
        console.log('_findWorstBrokenLinks: ', resource);
        var indexOfResource = worstOffenders.isInArray('url', resource.info.url);
        if(indexOfResource !== -1) worstOffenders.array[indexOfResource].length++;
        else worstOffenders.addItem(new Offender(resource.info.url));
    });

    worstOffenders.sortByProp('length', true);
    this.worstOffenders = worstOffenders.array.slice(0,5);
}; 

/*
    - grabs fills the site object with all the info the sitesService.save needs in order to save it to the db.
*/
Site.prototype.makeStub = function() {
    this.brokenResources = [];
    this.date = new Date().toLocaleString();
    this.crawlDurationInSeconds = null;
    this.Resources = [null];
    this.downloadedResources = [null];
    this.brokenResources = [null];
    this.redirectedResources = [null];
    this.fetchTimeouts = [null];
    this.pages = [];

    return this;
};

var Offender = function(url) {
    this.url = url;
    this.length = 1;
}

var OffendersList = function() {
    this.array = [];
};
OffendersList.prototype.isInArray = function(prop, val) {
    return this.array.map(function (element) {return element[prop];}).indexOf(val);
};
OffendersList.prototype.sortByProp = function(prop, back) {
    back = back || false;
    this.array.sort(function(a,b) {

        // least to greatest
        if (!back && a[prop] < b[prop]) return -1;
        else if (!back && a[prop] > b[prop]) return 1;

        // greatest to least
        else if (back && a[prop] > b[prop]) return -1;
        else if (back && a[prop] < b[prop]) return 1;
        
        // a must be equal to b
        return 0;
    });

};
OffendersList.prototype.addItem = function(obj) {
    this.array.push(obj);
};

/*
    Snap shot of site crawling progress. Stored on server and given to client when status is requested.
    - combine this into Site.
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
module.exports.OffendersList = OffendersList;
