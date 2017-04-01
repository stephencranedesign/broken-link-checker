var Sites = require('../models/Sites.js');
var mongoose = require('mongoose'); // for drop function
var currCrawls = require('../custom-modules/currCrawls').currCrawls;
var Promise = require('bluebird');

function _create(user, site) {
    return Promise.resolve(Sites.create({ 
            url: site.url, 
            date: new Date().toLocaleString(), 
            brokenResources: site.brokenResources.length,
            worstOffenders: site.worstOffenders,
            crawlFrequency: site.crawlFrequency,
            crawlOptions: site.crawlOptions,
            crawlDurationInSeconds: site.crawlDurationInSeconds,
            user: user,
            totalPages: site.pages.length
        }))
        .then(function(doc) {
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
            date: new Date().toLocaleString(), 
            brokenResources: site.brokenResources.length,
            worstOffenders: site.worstOffenders,
            crawlFrequency: site.crawlFrequency,
            crawlOptions: site.crawlOptions,
            crawlDurationInSeconds: site.crawlDurationInSeconds,
            user: user,
            totalPages: site.pages.length
        }).exec();

    return promise
        .then(function(doc) {
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
                date: new Date().toLocaleString(), 
                brokenResources: site.brokenResources.length,
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

module.exports.findSite = function(user, url, callback, errback) {
    console.log('findSite: ', user, url)
    Sites.findOne({url: url, user: user}, function(err, doc) {
        if(err) {
            errback(err);
            return;
        }

        var isCrawling = false;
        if(doc !== null && currCrawls.isCrawlingSite(user, url)) isCrawling = true;

        callback({site: doc, isCrawling: isCrawling});
    });
};

module.exports.update = function(query, update) {
    return Sites.update(query, update).exec();
};

module.exports.list = function(user, callback, errback) {
    var query = { user: user };
    if(user === 'all') query = {};

    console.log('list: ', query);
    return Sites.find(query).exec();
};

module.exports.remove = function(query, callback, errback) {

    if(query.url === null || query.url === 'all') query = { user: query.user };
    return Sites.remove(query).exec();

};

module.exports.drop = function(callback) {
    Sites.remove(function(err, p){
        callback(err);
    });
};