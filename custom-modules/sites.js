/*
    Houses all instances of Site.js
    - allows us to get at timer.start() / timer.stop() on all site instances
*/

/* use - https://www.npmjs.com/package/timer.js */
var SitesService = require("../services/sites.js");
var Resources = require('../services/Resources.js');
var loopObj = require('./utils.js').loopObj;

var crawlerCtrl = require("../controllers/crawler");
var currCrawls = require("../custom-modules/CurrCrawls").currCrawls;

/* Site Stub */
var registered = {};

var register = function(site) {
    registered[site.user+"::"+site.host] = site;
};

/*
    removes resources for site, as well as site in db and on server.
    @return promise
*/
function unRegister(user, host, callback, errback) {
    console.log('unRegister:: ', user, host);

    if( isRegistered(user,host) !== undefined ) {
        console.log('delete registered: ', host);
        delete registered[user+"::"+host];
    }

    var crawl = currCrawls.getCrawl(user, host);
    console.log('unRegister crawl: ', crawl);
    if(crawl) crawl.stop();
    
    return Resources.remove({ user: user, host: host })
        .then(function() {
            return SitesService.remove({ user: user, host: host });
        });
};

function isRegistered(user, host) {
    return registered.hasOwnProperty(user+"::"+host) ? true : false;
}
function getRegistered(user, host) {
    return isRegistered(user, host) ? registered[user+"::"+host] : null;
}

function setCrawling(user, host, bool) { registered[user+"::"+host].isCrawling = bool; }
function isCrawling(user, host) { return registered[user+"::"+host].isCrawling; }


module.exports.register = register;
module.exports.unRegister = unRegister;
module.exports.registered = registered;
module.exports.isRegistered = isRegistered;
module.exports.getRegistered = getRegistered;
module.exports.setCrawling = setCrawling;
module.exports.isCrawling = isCrawling;
