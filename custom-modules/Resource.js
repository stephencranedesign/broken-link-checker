var ObjectID = require('mongodb').ObjectID;

/* 
    represents a Resouce.
*/

class Resource {
    constructor(siteUrl, queueItem) {
        this.info = queueItem;
        this._id = new ObjectID();
        this._siteUrl = siteUrl;
    }
}

module.exports = Resource;