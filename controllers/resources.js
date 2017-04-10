var CORS = require('../custom-modules/CORS');
var sites = require('../custom-modules/sites');
var normalizeUrl = require("../custom-modules/utils").normalizeUrl;

var Resources = require('../services/resources.js');
var SitesService = require('../services/sites.js');
var Offenders = require('../custom-modules/Offenders');

function _reCalcWorstOffenders(brokenResources) {
	console.log('ctrl brokenResources: ', brokenResources);
	var worstOffenders = new Offenders.List(brokenResources);
	worstOffenders.sortByProp('length', true);
    return { 
    	worstOffenders: worstOffenders.array.slice(0,5),
    	length: brokenResources.length
    };
};

function whiteList(req, res) {
	CORS.enable(res);
    
    var user = req.params.user;
    var host = normalizeUrl(req.body.host);
    var urls = req.body.urls;

    if(typeof urls === "string") urls = [urls];

    if(!sites.isRegistered(user, host)) res.status(403).json({ message: "site not registered" });


    var site = sites.getRegistered(user, host);

    /* 
        Goal: 
            - update isBroken to false 
            - figure out how many resources were affected.
    */
    var filter = { "url" : { $in: urls } },
        update = { $set: { whiteListed: true } };

    Resources.updateMany(filter, update)
        .then(function() {
        	return Resources.getBrokenLinks(user, host)
        })
        .then(_reCalcWorstOffenders)
        .then(updateSite)
        .catch(function(err) {
            console.log('something went wrong :(');
            console.log(err);
            res.status(500).json({ message: "failed to add urls to whitelist", err: err });
        });


    /*
        waits till all resources are updatedCount.

        Goal:
            - take an update count, and update brokenResources
            - add whitelist urls to site config.
            - recalc worst offenders.. or just remove it if in the worst offeneders list.

        - rework this:
            - make another call to the db for all broken resources, and then recalc the worst offenders list.
    */

    function updateSite(brokenResources) {
        console.log('updateSite: ', brokenResources);
        var query = { user: user, url: host },
            update = { 
                brokenResources: brokenResources.length, 
                $push: { "crawlOptions.whitelistedUrls": { $each: urls } },
                worstOffenders: brokenResources.worstOffenders
            };

        /*
            Store whitelist to site
        */
        if(site) site.whiteListAddUrl(urls);

        console.log('update query: ', query, update);


        return SitesService.update(query, update)
            .then(function(result) {
                console.log('result: ', result);
                res.status(200).json({ message: "successfully updated resources in db" });
            })
            .catch(function(err) {
                console.log('hi2', err);
                res.status(500).json({ message: "failed to add urls to whitelist", err: err });
            });
    };
};

function list(req, res) {
    var host = normalizeUrl(req.params.host);
    var user = req.params.user;

    var promise = Resources.find({ _siteUrl: host, user: user }).exec();

	promise.then(function(items) {
        console.log('callback: ', items);
        res.json(items);
    })
    .catch(function(err) {
        res.status(400).json(err);
    });
};

function getBrokenLinks(req, res) {
    CORS.enable(res);
    var host = normalizeUrl(req.params.host);
    var user = req.params.user;

    Resources.getBrokenLinks(user, host)
    .then(function(docs) {
        res.json(docs);
    })
    .catch(function(err) {
        res.status(400).json(err);
    });
};

function getWhiteList(req, res) {
    CORS.enable(res);
    var host = normalizeUrl(req.params.host);
    var user = req.params.user;

    console.log('getWhiteList')
    Resources.getWhiteListedLinks(user, host)
    .then(function(docs) {
        res.json(docs);
    })
    .catch(function(err) {
        res.status(400).json(err);
    });
};

function remove(req, res) {
    CORS.enable(res);

    var user = req.params.user;
    var host = normalizeUrl(req.body.host);
    var url = req.body.url;
    var referrer = req.body.referrer;

    if(!sites.isRegistered(user, host)) res.status(403).json({ message: "site not registered" });

    var query = { user: user, _siteUrl: host, url: url, referrer: referrer };

    Resources.remove(query)
        .then(function(o) {
            res.status(200).json({ message: "url removed for page" });
        })
        .catch(function(err) {
            res.status(403).json(err);
        });
};

module.exports.whiteList = whiteList;
module.exports.list = list;
module.exports.getBrokenLinks = getBrokenLinks;
module.exports.getWhiteList = getWhiteList;
module.exports.remove = remove;
