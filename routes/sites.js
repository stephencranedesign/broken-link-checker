var express = require('express');

var Sites = require('../services/sites.js');

var router = express.Router();

// examples from earlier in the course..
router.get('/sites', function(req, res) {
    console.log('sites: ');
    Sites.list(function(items) {
        console.log('callback: ', items);
        res.json(items);
    }, function(err) {
        res.status(400).json(err);
    });
});

router.get('/sites/findSite/:name', function(req, res) {
    console.log('name: ', req.params.name);
    Sites.findSite(req.params.name, function(doc) {
        console.log('find ', doc);
        res.json(doc);
    }, function(err) {
        console.log('err on delete: ', err);
        res.status(400).json(err);
    });
});

router.get('/sites/findBrokenLinks/:name', function(req, res) {
    console.log('name: ', req.params.name);
    Sites.findBrokenLinks(req.params.name, function(doc) {
        console.log('find ', doc);
        res.json(doc);
    }, function(err) {
        console.log('err on delete: ', err);
        res.status(400).json(err);
    });
});

router.get('/sites/delete', function(req, res) {
    Sites.remove(function(doc) {
        res.json(doc);
    }, function(err) {
        console.log('err on delete: ', err);
        res.status(400).json(err);
    });
});

// router.post('/items', function(req, res) {
    // Site.save(req.body.name, function(item) {
    //     res.status(201).json(item);
    // }, function(err) {
    //     res.status(400).json(err);
    // });
// });

module.exports = router;