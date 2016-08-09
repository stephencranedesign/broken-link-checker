var express = require('express');
var router = express.Router();

var ResourcesService = require('../services/resources.js');

router.get('/api/resources/list', function(req, res) {
	ResourcesService.list(function(items) {
        console.log('callback: ', items);
        res.json(items);
    }, function(err) {
        res.status(400).json(err);
    });
});

router.get("/api/resources/:host/brokenLinks", function(req, res) {
    ResourcesService.getBrokenLinks(req.params.host, function(docs) {
        res.json(docs);
    }, function(err) {
        res.status(400).json(err);
    });
});

router.get('/api/resources/drop', function(req, res) {
    ResourcesService.drop(function() {
        res.json({message: "resources dropped"});
    }, function(err) {
        res.status(400).json(err);
    });
});

module.exports = router;