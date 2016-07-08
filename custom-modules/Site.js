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
};
Site.prototype.fetchStart = function(queueItem) { 
    this.links.push(queueItem);
};
Site.prototype.fetchTimeout = function(queueItem) {
    this.fetchTimeouts.push(queueItem);
};
Site.prototype.crawlStarted = function() {
    this.crawlStartTime = Date.now();
};
Site.prototype.crawlFinished = function() {
    this.crawlEndTime = Date.now();
    this.crawlDurationInSeconds = capDecimals((this.crawlEndTime - this.crawlStartTime) / 1000, 2);
    this._processLinks();
};
Site.prototype._processLinks = function() {
    this.links.forEach(function(link) {

        // broken links
        if(link.status === "notfound" || link.status === "failed") this.brokenLinks.push(link);

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
var SiteStatus = function() {
    this.totalLinks = 0;
    this.processedLinks = 0;
    this.percentComplete = 0;
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