var ObjectID = require('mongodb').ObjectID;

/* 
    represents a page.
*/

class Page {
	constructor(siteUrl, path) {
		this._id = new ObjectID();
		this._siteUrl = siteUrl;
	    this.path = path;
	    this.resources = [];
	}
}

module.exports = Page;