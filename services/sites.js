var Sites = require('../models/Sites.js');
var mongoose = require('mongoose'); // for drop function
var crawler = require('../custom-modules/crawler');

function _create(user, site, callback, errback) {
    Sites.create(
        { 
            url: site.url, 
            // Resources: site.Resources, 
            date: new Date().toLocaleString(), 
            brokenResources: site.brokenResources.length,
            downloadedResources: site.downloadedResources.length,
            redirectedResources: site.redirectedResources.length,
            fetchTimeouts: site.fetchTimeouts.length,
            worstOffenders: site.worstOffenders,
            crawlFrequency: site.crawlFrequency,
            crawlOptions: site.crawlOptions,
            crawlDurationInSeconds: site.crawlDurationInSeconds,
            user: user,
            totalPages: site.pages.length
        }, function(err, doc) {
            if (err) {
                errback(err);
                return;
            }
            callback(doc);
            // mongoose.disconnect();
            return;
        }
    );
}

module.exports.save = function(user, site, callback, errback) {
    Sites.findOneAndUpdate(
        {
            url: site.url,
            user: user
        }, 
        { 
            // Resources: site.Resources, 
            date: new Date().toLocaleString(), 
            brokenResources: site.brokenResources.length,
            downloadedResources: site.downloadedResources.length,
            redirectedResources: site.redirectedResources.length,
            fetchTimeouts: site.fetchTimeouts.length,
            worstOffenders: site.worstOffenders,
            crawlFrequency: site.crawlFrequency,
            crawlOptions: site.crawlOptions,
            crawlDurationInSeconds: site.crawlDurationInSeconds,
            user: user,
            totalPages: site.pages.length
        }, function(err, doc) {
            if(err) {
                errback(err);
                return;
            }

            if(doc === null) _create(user, site, callback, errback);
            else callback(doc);
            // else mongoose.disconnect();
        }
    );
};

module.exports.updateLinkCount = function(user, site, callback, errback) {
    Sites.findOneAndUpdate(
        {
            url: site.url,
            user: user
        }, 
        { 
            // Resources: site.Resources, 
            date: new Date().toLocaleString(), 
            brokenResources: site.brokenResources.length,
            downloadedResources: site.downloadedResources.length,
            redirectedResources: site.redirectedResources.length,
            fetchTimeouts: site.fetchTimeouts.length,
            worstOffenders: site.worstOffenders,
            crawlFrequency: site.crawlFrequency,
            crawlOptions: site.crawlOptions,
            crawlDurationInSeconds: site.crawlDurationInSeconds,
            user: user
        }, function(err, doc) {
            if(err) {
                errback(err);
                return;
            }

            if(doc === null) _create(user, site, callback, errback);
            else callback(doc);
            // else mongoose.disconnect();
        }
    );
};

module.exports.findLinksForSite = function(user, url, callback, errback) {
    Sites.findOne({url: url, user: user }, 'url date downloadedLinks redirectedLinks').lean().exec(function(err, doc) {
        if(err) {
            errback(err);
            return;
        }

        callback(doc);
    });
};

module.exports.findbrokenLinks = function(user, url, callback, errback) {
    Sites.findOne({url: url, user: user}, 'url date brokenLinks' ,function(err, doc) {
        if(err) {
            errback(err);
            return;
        }

        callback(doc);
    });
};

module.exports.findSite = function(user, url, callback, errback) {
    Sites.findOne({url: url, user: user}, function(err, doc) {
        if(err) {
            errback(err);
            return;
        }

        var isCrawling = false;
        if(doc !== null && crawler.currCrawls.hasOwnProperty(url)) isCrawling = true;

        callback({site: doc, isCrawling: isCrawling});
    });
};

module.exports.list = function(user, callback, errback) {
    var query = { user: user };
    if(user === 'all') query = {};
    
    Sites.find(query, function(err, items) {
        if (err) {
            errback(err);
            return;
        }
        callback(items);
        // mongoose.disconnect();
    });
};

module.exports.remove = function(query, callback, errback) {
    if(query.url === null || query.url === 'all') {
        Sites.remove({ user: query.user }, function(err, item) {
            if(err) {
                callback(err);
                return;
            }

            callback(item);
        });
    }
    else {
        Sites.remove(query, function(err, item) {
            if(err) {
                callback(err);
                return;
            }

            callback(item);
        });
    }
};

module.exports.drop = function(callback) {
    Sites.remove(function(err, p){
        callback(err);
    });
};