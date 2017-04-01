var capDecimals = require('./utils.js').capDecimals;

/*
    Snap shot of site crawling progress. Stored on server and given to client when status is requested.
    - combine this into Site.
*/
class SiteStatus {
    constructor(crawlType) {
        this.totalResources = 0;
        this.processedResources = 0;
        this.percentComplete = 0;
        this.crawlType = crawlType || 'full-site';
    }

    updateProcessResources() { 
        this.processedResources++; 
        this.updatePercentComplete(); 
    };

    updateTotalResources(length) { 
        this.totalResources = length; 
        this.updatePercentComplete(); 
    };

    updatePercentComplete() { 
        this.percentComplete = capDecimals(this.processedResources/this.totalResources, 2); 
    };
};

module.exports = SiteStatus;
