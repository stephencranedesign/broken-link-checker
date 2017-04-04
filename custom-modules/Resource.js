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
        this.whiteListed = config.whiteListed || false;
    }
}

module.exports = Resource;