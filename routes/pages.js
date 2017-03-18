var express = require('express');
var router = express.Router();
var AUTH = require('../custom-modules/authentication');

var PagesService = require('../services/pages.js');
var normalizeUrl = require("../custom-modules/utils").normalizeUrl;

router.get('/api/:user/pages/:host/list', function(req, res) {
    var host = normalizeUrl(req.params.host);
    var user = req.params.user;

	PagesService.listForSite(user, host, function(items) {
        console.log('callback: ', items);
        res.json(items);
    }, function(err) {
        res.status(400).json(err);
    });
});

router.post('/api/:user/pages/:host/getPath', function(req, res) {
    var host = normalizeUrl(req.params.host);
    var user = req.params.user;

    PagesService.listForSiteByPath(user, host, req.body.path, function(items) {
        console.log('callback: ', items);
        res.json(items);
    }, function(err) {
        res.status(400).json(err);
    });
});

router.get("/api/:user/pages/:host/update/:path", function(req, res) {

});

router.post("/api/:user/pages/:host/add/:path", function(req, res) {

});

router.post("/api/:user/pages/:host/delete/:path", function() {

});


module.exports = router;