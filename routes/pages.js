var express = require('express');
var router = express.Router();

var PagesService = require('../services/pages.js');

router.get('/api/pages/list', function(req, res) {
	PagesService.list(function(items) {
        console.log('callback: ', items);
        res.json(items);
    }, function(err) {
        res.status(400).json(err);
    });
});

router.get('/api/pages/drop', function(req, res) {
    PagesService.drop(function() {
        res.json({message: "pages dropped"});
    }, function(err) {
        res.status(400).json(err);
    });
});

module.exports = router;