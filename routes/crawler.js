var express = require('express');
var router = express.Router();
var crawler = require('../custom-modules/crawler.js');
var SiteService = require('../services/sites.js');

router.post('/api/crawler/:host/start', function(req, res) {
	console.log('req: ', req.body);
	crawler(req.params.host, { id: 'test' }, function(site) {
		SiteService.save(site, function(doc) {
            console.log('saved', res);
            res.json(doc);
        }, function(err) {
            console.log('error: ', err);
            res.status(400).json(err);
        });
	});
});

module.exports = router;