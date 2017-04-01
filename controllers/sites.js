var SitesService = require('../services/sites.js');

var CORS = require('../custom-modules/CORS');
var AUTH = require('../custom-modules/authentication');

var normalizeUrl = require("../custom-modules/utils").normalizeUrl;


function listEndPoint(req, res) {
    var user = req.params.user;

    SitesService.list(user)
        .then(function(items) {
            console.log('callback: ', items);
            res.json(items);
        })
        .catch(function(err) {
            res.status(400).json(err);
        });
};

function findEndPoint(req, res) {
    var host = normalizeUrl(req.params.host);
    var user = req.params.user;

    CORS.enable(res);
    SitesService.findSite(user, host, function(doc) {
        res.json(doc);
    }, function(err) {
        console.log('err on delete: ', err);
        res.status(400).json(err);
    });
};

function findBrokenLinksEndPoint(req, res) {
    console.log('host: ', req.params.host);
    var host = normalizeUrl(req.params.host);
    var user = req.params.user;
    
    SitesService.findBrokenLinks(user, host, function(doc) {
        console.log('find ', doc);
        res.json(doc);
    }, function(err) {
        console.log('err on delete: ', err);
        res.status(400).json(err);
    });
};



module.exports.listEndPoint = listEndPoint;
module.exports.findEndPoint = findEndPoint;
module.exports.findBrokenLinksEndPoint = findBrokenLinksEndPoint;