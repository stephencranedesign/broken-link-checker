var Sites = require('../models/Sites.js');

function _normalizeUrl(url) {
    // regex to normalize entries somehow?
    return url.replace('http://', '').replace('https://', '').replace('www.', '');
}

function _create(site, callback, errback) {
    Sites.create({ url: site.url, links: site.links, date: new Date().toLocaleString(), brokenLinks: site.brokenLinks }, function(err, doc) {
        if (err) {
            errback(err);
            return;
        }
        callback(doc);
        // mongoose.disconnect();
        return;
    });
}

module.exports.save = function(site, callback, errback) {
    console.log('site: ', site);
    site.url = _normalizeUrl(site.url);
    console.log('##### site: ', site.url);

    Sites.findOneAndUpdate({url: site.url}, { links: site.links, date: new Date().toLocaleString(), brokenLinks: site.brokenLinks }, function(err, doc) {
        if(err) {
            errback(err);
            return;
        }

        if(doc === null) _create(site, callback, errback);
        // else mongoose.disconnect();
    });
};

module.exports.findLinksForSite = function(url, callback, errback) {
    url = _normalizeUrl(url);
    console.log('url: ', url);
    Sites.findOne({url: url}, 'url date links').lean().exec(function(err, doc) {
        if(err) {
            errback(err);
            return;
        }

        callback(doc);
    });
};

module.exports.findBrokenLinks = function(url, callback, errback) {
    url = _normalizeUrl(url);
    console.log('url: ', url);
    Sites.findOne({url: url}, 'url date brokenLinks' ,function(err, doc) {
        if(err) {
            errback(err);
            return;
        }

        callback(doc);
    });
};

module.exports.findSite = function(url, callback, errback) {
    url = _normalizeUrl(url);
    console.log('url: ', url);
    Sites.findOne({url: url}, function(err, doc) {
        if(err) {
            errback(err);
            return;
        }

        callback(doc);
    });
};

module.exports.list = function(callback, errback) {
    Sites.find(function(err, items) {
        if (err) {
            errback(err);
            return;
        }
        callback(items);
        // mongoose.disconnect();
    });
};

module.exports.remove = function(path, callback, errback) {
    if(path === null || path === 'all') {
        Sites.remove(function(err, item) {
            if(err) {
                callback(err);
                return;
            }

            callback(item);
            // mongoose.disconnect();
        });
    }
    else {
        Sites.remove(path, function(err, item) {
            if(err) {
                callback(err);
                return;
            }

            callback(item);
            // mongoose.disconnect();
        });
    }
};