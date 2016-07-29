var Sites = require('../models/Sites.js');
var mongoose = require('mongoose'); // for drop function

function _normalizeUrl(url) {
    // regex to normalize entries somehow?
    return url.replace('http://', '').replace('https://', '').replace('www.', '');
}

function _create(site, callback, errback) {
    Sites.create(
        { 
            url: site.url, 
            // Resources: site.Resources, 
            date: new Date().toLocaleString(), 
            brokenResources: site.brokenResources.length,
            downloadedResources: site.downloadedResources.length,
            redirectedResources: site.redirectedResources.length,
            fetchTimeouts: site.fetchTimeouts.length,
            crawlFrequency: site.crawlFrequency,
            crawlOptions: site.crawlOptions,
            crawlDurationInSeconds: site.crawlDurationInSeconds,
            totalPages: site.pages.length
        }, function(err, doc) {
            if (err) {
                errback(err);
                return;
            }
            console.log('_create');
            callback(doc);
            // mongoose.disconnect();
            return;
        }
    );
}

module.exports.save = function(site, callback, errback) {
    site.url = _normalizeUrl(site.url);
    Sites.findOneAndUpdate(
        {
            url: site.url
        }, 
        { 
            // Resources: site.Resources, 
            date: new Date().toLocaleString(), 
            brokenResources: site.brokenResources.length,
            downloadedResources: site.downloadedResources.length,
            redirectedResources: site.redirectedResources.length,
            fetchTimeouts: site.fetchTimeouts.length,
            crawlFrequency: site.crawlFrequency,
            crawlOptions: site.crawlOptions,
            crawlDurationInSeconds: site.crawlDurationInSeconds,
            totalPages: site.pages.length
        }, function(err, doc) {
            if(err) {
                errback(err);
                return;
            }

            if(doc === null) _create(site, callback, errback);
            else callback(doc);
            // else mongoose.disconnect();
        }
    );
};

module.exports.updateLinkCount = function(site, callback, errback) {
    site.url = _normalizeUrl(site.url);
    Sites.findOneAndUpdate(
        {
            url: site.url
        }, 
        { 
            // Resources: site.Resources, 
            date: new Date().toLocaleString(), 
            brokenResources: site.brokenResources.length,
            downloadedResources: site.downloadedResources.length,
            redirectedResources: site.redirectedResources.length,
            fetchTimeouts: site.fetchTimeouts.length,
            crawlFrequency: site.crawlFrequency,
            crawlOptions: site.crawlOptions,
            crawlDurationInSeconds: site.crawlDurationInSeconds
        }, function(err, doc) {
            if(err) {
                errback(err);
                return;
            }

            if(doc === null) _create(site, callback, errback);
            else callback(doc);
            // else mongoose.disconnect();
        }
    );
};

module.exports.findLinksForSite = function(url, callback, errback) {
    url = _normalizeUrl(url);
    Sites.findOne({url: url}, 'url date downloadedLinks redirectedLinks').lean().exec(function(err, doc) {
        if(err) {
            errback(err);
            return;
        }

        callback(doc);
    });
};

module.exports.findbrokenLinks = function(url, callback, errback) {
    url = _normalizeUrl(url);
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
    console.log('remove: ', path);
    if(path === null || path === 'all') {
        Sites.remove(function(err, item) {
            if(err) {
                callback(err);
                return;
            }

            callback(item);
        });
    }
    else {
        Sites.remove({url: path}, function(err, item) {
            if(err) {
                callback(err);
                return;
            }

            callback(item);
        });
    }
};

module.exports.drop = function(callback, errback) {
    mongoose.connection.collections['sites'].drop( function(err) {
        if(err) {
            console.log('err: ', err);
            errback(err);
        }

        callback();
    });
};