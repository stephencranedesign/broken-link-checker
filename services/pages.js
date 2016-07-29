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

module.exports.remove = function(query, callback, errback) {
	Pages.find().remove(query, function(err) {
		if(err) {
			errback(err);
			return;
		}

		callback();
	});
};

module.exports.drop = function(callback, errback) {
    mongoose.connection.collections['pages'].drop( function(err) {
        if(err) {
            console.log('err: ', err);
            errback(err);
        }

        callback();
    });
};
