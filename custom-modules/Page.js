var ObjectID = require('mongodb').ObjectID;

/* 
    represents a page.
*/

class Page {
	constructor(siteUrl, fullUrl, path) {
		this._id = new ObjectID();
		this._siteUrl = siteUrl;
	    this.path = path;
	    this.fullUrl = fullUrl;
	    this.resources = [];
	}
}

module.exports = Page;