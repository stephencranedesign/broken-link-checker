var Sites = require('../models/Sites.js');
var mongoose = require('mongoose'); // for drop function
var crawler = require('../custom-modules/crawler');
var Promise = require('bluebird');

function _create(user, site) {
    return Promise.resolve(Sites.create({ 
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
        }))
        .then(function(doc) {
            console.log('_create:: ', doc);
            return doc;
        });
}

module.exports.save = function(user, site) {

    var promise = Sites.findOneAndUpdate(
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
        }).exec();

    return promise
        .then(function(doc) {
            console.log('siteService save() :', doc);
            if(doc === null) return _create(user, site);
            else return doc;
        });
};

module.exports.updateLinkCount = function(user, site, callback, errback) {
    return new Promise(function(resolve, reject) {
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
                if(err) reject(err);

                if(doc === null) return _create(user, site);
                else resolve(doc);
            }
        );
    });
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
    console.log('findSite: ', user, url)
    Sites.findOne({url: url, user: user}, function(err, doc) {
        if(err) {
            errback(err);
            return;
        }

        var isCrawling = false;
        if(doc !== null && crawler.currCrawls.isCrawlingSite(user, url)) isCrawling = true;

        callback({site: doc, isCrawling: isCrawling});
    });
};

module.exports.update = function(query, update, callback) {
    Sites.update(query, update, function(err, result) {
        if(err) {
            callback(err);
            return;
        }
        callback(null, result);
    })
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