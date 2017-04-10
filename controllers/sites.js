var SitesService = require('../services/sites.js');

var CORS = require('../custom-modules/CORS');
var AUTH = require('../custom-modules/authentication');

var normalizeUrl = require("../custom-modules/utils").normalizeUrl;

var sites = require('../custom-modules/sites');


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
    var url = normalizeUrl(req.params.host);
    var user = req.params.user;

    CORS.enable(res);
    SitesService.findOne({ user: user, url: url })
        .then(function(doc) {

            var isCrawling = false;
            if(doc !== null && sites.isCrawling(user, url)) isCrawling = true;

            var o = { site: doc, isCrawling: isCrawling };

            res.json(o);
        })
        .catch(function(err) {
            console.log('err on delete: ', err);
            res.status(400).json(err);
        });
};



module.exports.listEndPoint = listEndPoint;
module.exports.findEndPoint = findEndPoint;

