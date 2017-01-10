var express = require('express');
var router = express.Router();
var CORS = require('../custom-modules/CORS');
var ResourcesService = require('../services/resources.js');
var AUTH = require('../custom-modules/authentication');

var normalizeUrl = require("../custom-modules/utils").normalizeUrl;

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

AUTH.secure("/api/:user/resources/drop");
router.get('/api/resources/drop', function(req, res) {

    ResourcesService.drop(function() {
        res.json({message: "resources dropped"});
    }, function(err) {
        res.status(400).json(err);
    });
});

module.exports = router;