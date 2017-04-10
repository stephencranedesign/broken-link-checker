var ObjectID = require('mongodb').ObjectID;
var URI = require('urijs');

/* 
    represents a page.
*/

class Page {
	constructor(url, path, resources) {
	    this.path = path;
	    this.url = url;
	    this.timeStamp = new Date().toLocaleString();
	    this.resources = this._prepResources(resources);
	}

	_prepResources(resources) {
		resources = resources || [];
		var array = [];
		var basePageUri = new URI(this.url);

		resources.forEach((url) => {

			var uri = new URI(url.url);
			var absPath;

			// its a relative path
			if(uri.hostname === null) absPath = basePageUri._parts.protocol + "://" + basePageUri._parts.hostname + uri._parts.path;
			
			// its an abs path
			else absPath = uri._parts.protocol + "://" + uri._parts.hostname + uri._parts.path;

			array.push({
				absPath: absPath,
				urlOnPage: url.url,
				referrer: this.url,
				tagRef: url.tagRef,
				parentTagRef: url.parentTagRef,
				prevTagRef: url.prevTagRef,
				nextTagRef: url.nextTagRef
			});
		});

		return array;
	}
}

module.exports = Page;