var Resources = require('../models/Resources.js');


module.exports.updateMany = function(filter, update) {
	return Resources.collection.updateMany(filter, update);
};

module.exports.insertMany = function(array) {
	array.forEach(function(item) {
		if(item.contentType === undefined || item.contentType === 'undefined') console.log('item: ', item);
	});
	return Resources.insertMany(array);
};

module.exports.count = function(query) {
	return Resources.count(query);
}

module.exports.find = function(query) {
    return Resources.find(query);
};

module.exports.listForSite = function(user, site) {
	return Resources.find({ host: site, user: user });
};

module.exports.remove = function(query, callback, errback) {
	return Resources.remove(query);
};

module.exports.getBrokenLinks = function(user, url) {
	return Resources.find(
		{ host: url, user: user, whiteListed: false },
		{ _id: 0, host: 0, user: 0, whiteListed: 0 });
};

module.exports.getWhiteListedLinks = function(user, url) {
	return Resources.distinct('url', { host: url, user: user, whiteListed: true });
};
