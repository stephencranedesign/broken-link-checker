/*
    Houses all instances of Site.js
    - allows us to get at timer.start() / timer.stop() on all site instances
*/

/* use - https://www.npmjs.com/package/timer.js */
var SitesService = require("../services/sites.js");
var ResourcesService = require("../services/Resources.js");
var loopObj = require('./utils.js').loopObj;

var crawlerCtrl = require("../controllers/crawler");
var currCrawls = require("../custom-modules/CurrCrawls").currCrawls;

/* Site Stub */
var registered = {};

var register = function(site, saveToDb, callback, errback) {

    registered[site.user+"::"+site.url] = site;

    /*
        siteStub should only be saved to db if it was hit by the endpoint.
        If we already have info for it on the db, we don't want to over-ride that info with the site stub..
    */
    if( !saveToDb ) return;

    SitesService.save(site.user, site.makeStub())
    .then(function(doc) {
        console.log("saved to db from register: ", doc);
        if(callback) callback(site);
    })
    .catch(function(err) {
        console.log("error trying to save to db from register: ", err);
        if(errback) errback(err);
    });
};

/*
    removes resources for site, as well as site in db and on server.
    @return promise
*/
function unRegister(user, url, callback, errback) {
    console.log('unRegister::: ', user, url);
    if( isRegistered(user,url) !== undefined ) {
        console.log('delete registered: ', url);
        registered[user+"::"+url].timer.stop();
        delete registered[user+"::"+url];
    }

    var crawl = currCrawls.getCrawl(user, url);
    console.log('unRegister crawl: ', crawl);
    if(crawl) crawl.stop();
    
    return ResourcesService.remove({ user: user, _siteUrl: url })
        .then(function(o) {
            console.log('b4 SitesService.remove', o);
            return SitesService.remove({ user: user, url: url });
        });
};

function isRegistered(user, url) {
    return registered.hasOwnProperty(user+"::"+url) ? true : false;
}
function getRegistered(user, url) {
    return isRegistered(user, url) ? registered[user+"::"+url] : null;
}

function updateRegistered(site) {
    if(isRegistered(site.user, site.url)) registered[site.user+"::"+site.url] = site;
}


module.exports.register = register;
module.exports.unRegister = unRegister;
module.exports.registered = registered;
module.exports.isRegistered = isRegistered;
module.exports.getRegistered = getRegistered;
module.exports.updateRegistered = updateRegistered;
