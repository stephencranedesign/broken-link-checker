var Pages = require('../models/Pages.js');
var mongoose = require('mongoose'); // for drop function

module.exports.findOneAndUpdate = function(user, page, callback, errback) {
	Pages.findOneAndUpdate({ _id: page._id, user: user }, page, { upsert: true }, function(err, doc) {
		if(err) {
			errback(err);
			return;
		}

		callback(doc);
	});
};

module.exports.insertMany = function(pages, callback, errback) {
	Pages.insertMany(pages, function(err, docs) {
		if(err) {
			errback(err);
			return;
		}

		callback(docs);
	});
};

module.exports.list = function(user, callback, errback) {
	Pages.find({ user: user }, function(err, items) {
        if (err) {
            errback(err);
            return;
        }
        callback(items);
        // mongoose.disconnect();
    });
};

module.exports.listForSite = function(user, site, callback, errback) {
	Pages.find({ _siteUrl: site, user: user }, function(err, items) {
        if (err) {
            errback(err);
            return;
        }
        callback(items);
        // mongoose.disconnect();
    });
};

module.exports.listForSiteByPath = function(user, site, path, callback, errback) {

	Pages.find({ user: user, _siteUrl: site, path: path }, function(err, items) {
        if (err) {
            errback(err);
            return;
        }
        callback(items);
        // mongoose.disconnect();
    });
};

module.exports.remove = function(query, callback, errback) {
	Pages.remove(query, function(err, result) {
		if(err) {
			errback(err);
			return;
		}

		callback();
	});
};

module.exports.getPageByPath = function(user, url, path, callback, errback) {
	module.exports.remove({ _siteUrl: url,  path: path, user: user }, callback, errback);
};

module.exports.drop = function(callback) {
    Pages.remove(function(err, p){
        callback(err);
    });
};
