var express = require('express');
var router = express.Router();
var Sites = require('../services/sites.js');
var scheduler = require("../custom-modules/scheduler.js");
var CORS = require('../custom-modules/CORS');
var AUTH = require('../custom-modules/authentication');

var normalizeUrl = require("../custom-modules/utils").normalizeUrl;

/*
    endpoints for getting at the info saved.
    dont see a need for authentication on these..
*/

router.get('/api/:user/sites/list', function(req, res) {
    var user = req.params.user;

    Sites.list(user, function(items) {
        console.log('callback: ', items);
        res.json(items);
    }, function(err) {
        res.status(400).json(err);
    });
});

router.get('/api/:user/sites/find/:host', function(req, res) {
    var host = normalizeUrl(req.params.host);
    var user = req.params.user;

    CORS.enable(res);
    Sites.findSite(user, host, function(doc) {
        res.json(doc);
    }, function(err) {
        console.log('err on delete: ', err);
        res.status(400).json(err);
    });
});

router.get('/api/:user/sites/findBrokenLinks/:host', function(req, res) {
    console.log('host: ', req.params.host);
    var host = normalizeUrl(req.params.host);
    var user = req.params.user;
    
    Sites.findBrokenLinks(user, host, function(doc) {
        console.log('find ', doc);
        res.json(doc);
    }, function(err) {
        console.log('err on delete: ', err);
        res.status(400).json(err);
    });
});

AUTH.secure("/api/:user/sites/drop");
router.get('/api/sites/drop', function(req, res) {

    Sites.drop(function() {
        res.json({message: "sites dropped"});
    }, function(err) {
        res.status(400).json(err);
    });
});

module.exports = router;