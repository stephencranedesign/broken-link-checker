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
Site.prototype.processLinks = function() {
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

module.exports = Site;