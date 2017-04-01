var ObjectID = require('mongodb').ObjectID;

/* 
    represents a page.
*/

class Page {
	constructor(url, path, resources) {
	    this.path = path;
	    this.url = url;
	    this.timeStamp = new Date().toLocaleString();
	    this.resources = resources || [];
	}
}

module.exports = Page;