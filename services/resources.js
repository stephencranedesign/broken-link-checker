var Resources = require('../models/Resources.js');
var mongoose = require('mongoose'); // for drop function

module.exports.findOneAndUpdate = function(resource, callback, errback) {
	Resources.findOneAndUpdate({ _id: resource._id }, resource, { upsert: true }, function(err, doc) {
		if(err) {
			errback(err);
			return;
		}

		callback(doc);
	});
};

module.exports.insertMany = function(resources, callback, errback) {
	resources.forEach(function(resource) {
		console.log("status: ", resource.info.status);
		if(resource.info.status === "failed" || resource.info.status === "notfound") console.log("***brokenResource: ", resource);
	});
	Resources.insertMany(resources, function(err, docs) {
		if(err) {
			if(errback) errback(err);
			return;
		}

		console.log("Resources | insertMany");
		 if(callback) callback(docs);
	});
};

module.exports.list = function(callback, errback) {
	Resources.find(function(err, items) {
        if (err) {
            errback(err);
            return;
        }
        callback(items);
    });
};

module.exports.listForSite = function(site, callback, errback) {
	Resources.find({ _siteUrl: site }, function(err, items) {
        if (err) {
            errback(err);
            return;
        }
        callback(items);
    });
};

module.exports.remove = function(query, callback, errback) {
	Resources.find().remove(query, function(err) {
		if(err) {
			errback(err);
			return;
		}

		callback();
	});
};

module.exports.drop = function(callback, errback) {
    mongoose.connection.collections['resources'].drop( function(err) {
        if(err) {
            console.log('err: ', err);
            errback(err);
        }

        callback();
    });
};

module.exports.getBrokenLinks = function(url, callback, errback) {
	console.log('getBrokenLinks: ', url);
	Resources.find(
		{ _siteUrl: url, isBroken: true }, 
		{ info: 1, _id: 0 }, 
		function(err, docs) {
			console.log('yo man..', url, docs);
			if(err) {
				errback(err);
				return;
			}

			callback(docs);
		}
	);
};

module.exports.nukeResourcesForPage = function(array, callback, errback) {
	console.log('array: ', array);
	var query = ["$or:["];
	array.forEach(function(id) {
		query.push("{_id:"+id+"},");
	});
	query.push("]");

	console.log('query: ', query.join(""));

	Resources.find().remove(query.join(""), function(err, doc) {
		if(err) {
			errback(err);
			return;
		}

		callback(doc);
	});
};
