var express = require('express');
var router = express.Router();

var CORS = require('../custom-modules/CORS');
var AUTH = require('../custom-modules/authentication');
var recursiveCheck = require("../custom-modules/utils").recursiveCheck;
var isSiteRegistered = require('../custom-modules/scheduler').isSiteRegistered;
var getRegisteredSite = require('../custom-modules/scheduler').getRegisteredSite;
var normalizeUrl = require("../custom-modules/utils").normalizeUrl;
var Site = require("../custom-modules/Site");

var ResourcesService = require('../services/resources.js');
var SitesService = require('../services/sites.js');

router.get('/api/:user/resources/:host/list', function(req, res) {
    var host = normalizeUrl(req.params.host);
    var user = req.params.user;

	ResourcesService.listForSite(user, host, function(items) {
        console.log('callback: ', items);
        res.json(items);
    }, function(err) {
        res.status(400).json(err);
    });
});

router.get("/api/:user/resources/:host/brokenLinks", function(req, res) {
    CORS.enable(res);
    var host = normalizeUrl(req.params.host);
    var user = req.params.user;

    ResourcesService.getBrokenLinks(user, host, function(docs) {
        res.json(docs);
    }, function(err) {
        res.status(400).json(err);
    });
});

// AUTH.secure("/api/:user/resources/whitelist");
router.post("/api/:user/resources/whitelist", function(req, res) {
    CORS.enable(res);
    var user = req.params.user;
    var host = normalizeUrl(req.body.host);
    var urls = req.body.urls;

    if(typeof urls === "string") urls = [urls];

    if(!isSiteRegistered(user, host)) {
        res.status(403).json({ message: "site not registered" });
    }
    else {

        var site = getRegisteredSite(user, host);

        /* 
            Goal: 
                - update isBroken to false 
                - figure out how many resources were affected.
        */
        var filter = { "info.url" : { $in: urls } },
            update = { $set: { isBroken: "false" } };

        ResourcesService.updateMany(filter, update, function(err, result) {
            if(err) {
                console.log(err);
                res.status(500).json({ message: "failed to add urls to whitelist", err: err });
            }

            updateSite(result);
        });


        /*
            waits till all resources are updatedCount.

            Goal:
                - take an update count, and update brokenResources
                - add whitelist urls to site config.
                - recalc worst offenders.. or just remove it if in the worst offeneders list.
        */

        function updateSite(result) {
            console.log('updateSite: ', result);
            var query = { user: user, url: host },
                update = { 
                    $inc: { brokenResources: result.modifiedCount*-1 }, 
                    $push: { "crawlOptions.whitelistedUrls": { $each: urls } },
                    $pull: { "worstOffenders": { url: { $in: urls } } }
                };

            /*
                Store whitelist to site
            */
            if(site) site.whiteListAddUrl(urls);

            SitesService.update(query, update,
                function(err, result) { // callback
                    if(err) {
                        console.log('hi2', err);
                        res.status(500).json({ message: "failed to add urls to whitelist", err: err });
                        return;
                    }

                    console.log('result: ', result);
                    res.status(200).json({ message: "successfully updated resources in db" });
                }
            );
        };
    }
});

module.exports = router;