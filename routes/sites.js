var express = require('express');
var router = express.Router();
var Sites = require('../services/sites.js');

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

router.get('/api/sites/delete/:name', function(req, res) {
    var path = req.params.name || 'all';
    Sites.remove(path, function(doc) {
        res.json(doc);
    }, function(err) {
        console.log('err on delete: ', err);
        res.status(400).json(err);
    });
});

module.exports = router;