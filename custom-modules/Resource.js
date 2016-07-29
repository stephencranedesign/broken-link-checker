var ObjectID = require('mongodb').ObjectID;

/* 
    represents a Resouce.
*/

class Resource {
    constructor(siteUrl, isBroken, queueItem) {
        this.info = queueItem;
        this._id = new ObjectID();
        this._siteUrl = siteUrl;
        this.isBroken = isBroken;
    }
}

module.exports = Resource;