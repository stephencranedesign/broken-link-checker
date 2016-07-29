var express = require('express');
var router = express.Router();
var Sites = require('../services/sites.js');
var scheduler = require("../custom-modules/scheduler.js");

/*
    endpoints for getting at the info saved.
    dont see a need for authentication on these..
*/

router.get('/api/sites/list', function(req, res) {
    console.log('sites: ');
    Sites.list(function(items) {
        console.log('callback: ', items);
        res.json(items);
    }, function(err) {
        res.status(400).json(err);
    });
});

router.get('/api/sites/find/:name', function(req, res) {
    console.log('name: ', req.params.name);
    Sites.findSite(req.params.name, function(doc) {
        console.log('find ', doc);
        res.json(doc);
    }, function(err) {
        console.log('err on delete: ', err);
        res.status(400).json(err);
    });
});

router.get('/api/sites/findBrokenLinks/:name', function(req, res) {
    console.log('name: ', req.params.name);
    Sites.findBrokenLinks(req.params.name, function(doc) {
        console.log('find ', doc);
        res.json(doc);
    }, function(err) {
        console.log('err on delete: ', err);
        res.status(400).json(err);
    });
});

router.get('/api/sites/drop', function(req, res) {
    Sites.drop(function() {
        res.json({message: "sites dropped"});
    }, function(err) {
        res.status(400).json(err);
    });
});

module.exports = router;