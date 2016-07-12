var capDecimals = require('./utils.js').capDecimals;

/*
    Description of the site. this is what we eventually send to Db to save info.
*/
var Site = function(url, crawlFrequency, crawlOptions) {
    this.url = url;
    this.uId = 0;
    this.fetchTimeouts = [];
    this.links = [];
    this.redirectedLinks = [];
    this.brokenLinks = [];
    this.actualLinks = [];
    this.validLinks = [];
    this.crawlFrequency = crawlFrequency;
    this.crawlOptions = crawlOptions;
    this.crawlType = crawlOptions.crawlType || 'full-site';
};
Site.prototype.fetchStart = function(queueItem) { 
    this.links.push(queueItem);
};
Site.prototype.fetchTimeout = function(queueItem) {
    this.fetchTimeouts.push(queueItem);
};
Site.prototype.crawlStarted = function() {
    if(this.crawlType === 'page-update') return;
    this.crawlStartTime = Date.now();
};
Site.prototype.crawlFinished = function(dontProcessTime) {
    this._processLinks();
    if(this.crawlType === 'page-update' || dontProcessTime) return;
    this.crawlEndTime = Date.now();
    this.crawlDurationInSeconds = capDecimals((this.crawlEndTime - this.crawlStartTime) / 1000, 2);
};
Site.prototype._isBrokenLink = function(link) {
    var brokenLink = false;
    if(link.status === "notfound" || link.status === "failed") brokenLink = true;

    // 404 error page
    else if(link.status === "redirected" && /\/404\.aspx\?aspxerrorpath=\//.test(link.stateData.headers.location)) brokenLink = true;

    return brokenLink;
};
Site.prototype._processLinks = function() {
    this.links.forEach(function(link) {

        // broken links
        if(this._isBrokenLink(link)) this.brokenLinks.push(link);

        // redirect links
        else if(link.status === "redirected") {
            this.redirectedLinks.push(link);
            this.validLinks.push(link);
        }

        // downloaded links
        else if( link.status === "downloaded" ) {
            this.actualLinks.push(link);
            this.validLinks.push(link);
        }

    }.bind(this));
};

/*
    Snap shot of site crawling progress. Stored on server and given to client when status is requested.
*/
var SiteStatus = function(crawlType) {
    this.totalLinks = 0;
    this.processedLinks = 0;
    this.percentComplete = 0;
    this.crawlType = crawlType || 'full-site';
};
SiteStatus.prototype.updateProcessLinks = function() { 
    this.processedLinks++; 
    this.updatePercentComplete(); 
};
SiteStatus.prototype.updateTotalLinks = function(length) { 
    this.totalLinks = length; 
    this.updatePercentComplete(); 
};
SiteStatus.prototype.updatePercentComplete = function() { 
    this.percentComplete = capDecimals(this.processedLinks/this.totalLinks, 2); 
};

module.exports.Site = Site;
module.exports.SiteStatus = SiteStatus;