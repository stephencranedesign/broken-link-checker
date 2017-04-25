var SitesService = require('../services/sites.js');

var CORS = require('../custom-modules/CORS');
var AUTH = require('../custom-modules/authentication');

var normalizeHost = require("../custom-modules/utils").normalizeHost;

var sites = require('../custom-modules/sites');


function listEndPoint(req, res) {
    var user = req.params.user;

    SitesService.find({})
        .then(function(items) {
            console.log('callback: ', items);
            res.json(items);
        })
        .catch(function(err) {
            res.status(400).json(err);
        });
};

function findEndPoint(req, res) {
    var host = normalizeHost(req.params.host);
    var user = req.params.user;

    console.log('findEndPoint: ', host, user);

    CORS.enable(res);
    SitesService.findOne({ user: user, host: host })
        .then(function(doc) {

            var isCrawling = false;
            if(doc !== null && sites.isCrawling(user, host)) isCrawling = true;

            var o = { site: doc, isCrawling: isCrawling };

            res.json(o);
        })
        .catch(function(err) {
            console.log('err on delete: ', err);
            res.status(400).json(err);
        });
};

function updateConfigEndPoint(req, res) {
    var host = normalizeHost(req.params.host);
    var user = req.params.user;
    var crawlOptions = req.body;

    CORS.enable(res);

    SitesService.update({ user: user ,host }, { crawlOptions: crawlOptions })
        .then(function(doc) {
            res.status(200).json(doc);
        })
        .catch(function(err) {
            res.status(400).json(err);
        })
};



module.exports.listEndPoint = listEndPoint;
module.exports.findEndPoint = findEndPoint;
module.exports.updateConfigEndPoint = updateConfigEndPoint;
