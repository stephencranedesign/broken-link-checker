var ObjectID = require('mongodb').ObjectID;

/* 
    represents a Resouce.
*/

class Resource {
    constructor(user, siteUrl, config) {
    	this.user = user;
    	this._siteUrl = siteUrl;
        this.contentType = config.contentType;
        this.url = config.url;
        this.timeStamp = config.timeStamp;
        this.referrer = config.referrer;
        this.status = config.status;
        this.tagRef = config.tagRef;
        this.parentTagRef = config.parentTagRef;
        this.prevTagRef = config.prevTagRef;
        this.nextTagRef = config.nextTagRef;
        this.whiteListed = config.whiteListed || false;
    }
}

module.exports = Resource;