var express = require('express');
var router = express.Router();
var crawler = require('../custom-modules/crawler.js');
var SiteMap = require('../custom-modules/SiteMap.js');
var SiteService = require('../services/sites.js');

router.post('/api/crawler/:host/start', function(req, res) {

	// crawling already happening for url
	if(crawler.isCrawling(req.params.host)) {
		res.json({message: 'crawling already in process', host: req.params.host});
	}

	// start crawling..
	crawler.crawl(req.params.host, req.body, function(site) {

		// generate siteMap
        var siteMap = new SiteMap(site.url, site.links);

		// save to db
		SiteService.save(site, function(doc) {

			// ftp to site
			siteMap.submit({
				host: doc.ftpHost, 
				user: doc.ftpUsername, 
				password: doc.ftpPassword,
				 
			}, function(res) {
				console.log('cool: ', res);
				res.json(res);
			}, function(err) {
				console.log('not cool: ', err);
				res.json(err);
			});

        }, function(err) {
            res.status(400).json(err);
        });
	});
});

router.get('/api/crawler/:host/status', function(req, res) {
	res.json({crawling: crawler.isCrawling(req.params.host), host: req.params.host});
});

module.exports = router;