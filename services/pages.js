var Pages = require('../models/Pages.js');
var mongoose = require('mongoose'); // for drop function

module.exports.findOneAndUpdate = function(page, callback, errback) {
	console.log("findOneAndUpdate");
	Pages.findOneAndUpdate({ _id: page._id }, page, { upsert: true }, function(err, doc) {
		if(err) {
			errback(err);
			return;
		}

		callback(doc);
	});
};

module.exports.insertMany = function(pages, callback, errback) {
	console.log('insertMany on pages: ', pages);
	Pages.insertMany(pages, function(err, docs) {
		if(err) {
			errback(err);
			return;
		}

		console.log("Pages | insertMany", docs);
		callback(docs);
	});
};

module.exports.list = function(callback, errback) {
	console.log("list");
	Pages.find(function(err, items) {
        if (err) {
            errback(err);
            return;
        }
        callback(items);
        // mongoose.disconnect();
    });
};

module.exports.listForSite = function(site, callback, errback) {
	console.log("list");
	Pages.find({ _siteUrl: site }, function(err, items) {
        if (err) {
            errback(err);
            return;
        }
        callback(items);
        // mongoose.disconnect();
    });
};

module.exports.listForSiteByPath = function(site, path, callback, errback) {
	console.log("listForSiteByPath: ", site, path);

	Pages.find({ "_siteUrl": site, "path": path }, function(err, items) {
        if (err) {
            errback(err);
            return;
        }
        console.log('test: ', err, items);
        callback(items);
        // mongoose.disconnect();
    });
};

module.exports.remove = function(query, callback, errback) {
	Pages.find().remove(query, function(err, result) {
		if(err) {
			errback(err);
			return;
		}

		callback();
	});
};

module.exports.getPageByPath = function(url, path, callback, errback) {
	console.log("nukePage");
	

	var query = {
		_siteUrl: url, 
		path: path
	};

	module.exports.remove(query, callback, errback);
};

module.exports.drop = function(callback, errback) {
    mongoose.connection.collections['pages'].drop( function(err) {
        if(err) {
            console.log('err: ', err);
            if(errback) errback(err);
            return;
        }

         if(callback) callback();
    });
};
