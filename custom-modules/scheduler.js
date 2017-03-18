/* use - https://www.npmjs.com/package/timer.js */
var SiteService = require("../services/sites.js");
var loopObj = require('./utils.js').loopObj;

var crawlerCtrl = require("../controllers/crawler-controller");
var currCrawls = require("../custom-modules/CurrCrawls").currCrawls;

/* Site Stub */
var registeredSites = {};
var registerSite = function(site, saveToDb, callback, errback) {
    registeredSites[site.user+"::"+site.url] = site;

    /*
        siteStub should only be saved to db if it was hit by the endpoint.
        If we already have info for it on the db, we don't want to over-ride that info with the site stub..
    */
    if( !saveToDb ) return callback(site);

    SiteService.save(site.user, site.makeStub())
    .then(function(doc) {
        console.log("saved to db from registerSite: ", doc);
        if(callback) callback(site);
    })
    .catch(function(err) {
        console.log("error trying to save to db from registerSite: ", err);
        if(errback) errback(err);
    });
};
function unRegisterSite(user, url, callback, errback) {
    console.log('unRegisterSite::: ', user, url);
    if( isSiteRegistered(user,url) !== undefined ) {
        console.log('delete registered: ', url);
        registeredSites[user+"::"+url].timer.stop();
        delete registeredSites[user+"::"+url];
    }

    var crawl = currCrawls.getCrawl(user, url);
    console.log('unRegisterSite crawl: ', crawl);
    if(crawl) crawl.stop();
    
    crawlerCtrl.unregisterSite(user, url, callback, errback);
};

function isSiteRegistered(user, url) {
    return registeredSites.hasOwnProperty(user+"::"+url) ? true : false;
}
function getRegisteredSite(user, url) {
    return isSiteRegistered(user, url) ? registeredSites[user+"::"+url] : null;
}

function updateRegisteredSite(site) {
    if(isSiteRegistered(site.user, site.url)) registeredSites[site.user+"::"+site.url] = site;
}


module.exports.registerSite = registerSite;
module.exports.unRegisterSite = unRegisterSite;
module.exports.registeredSites = registeredSites;
module.exports.isSiteRegistered = isSiteRegistered;
module.exports.getRegisteredSite = getRegisteredSite;
module.exports.updateRegisteredSite = updateRegisteredSite;

