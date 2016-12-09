var express = require('express');
var router = express.Router();

var PagesService = require('../services/pages.js');
var normalizeUrl = require("../custom-modules/utils").normalizeUrl;

router.get('/api/pages/:host/list', function(req, res) {
    var host = normalizeUrl(req.params.host);
	PagesService.listForSite(host, function(items) {
        console.log('callback: ', items);
        res.json(items);
    }, function(err) {
        res.status(400).json(err);
    });
});

router.post('/api/pages/:host/getPath', function(req, res) {
    var host = normalizeUrl(req.params.host);
    PagesService.listForSiteByPath(host, req.body.path, function(items) {
        console.log('callback: ', items);
        res.json(items);
    }, function(err) {
        res.status(400).json(err);
    });
});

router.get("/api/pages/:host/update/:path", function(req, res) {

});

router.post("/api/pages/:host/add/:path", function(req, res) {

});

router.post("/api/pages/:host/delete/:path", function() {

});

router.get('/api/pages/drop', function(req, res) {
    PagesService.drop(function() {
        res.json({message: "pages dropped"});
    }, function(err) {
        res.status(400).json(err);
    });
});

module.exports = router;