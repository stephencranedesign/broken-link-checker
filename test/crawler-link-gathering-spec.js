var chai = require('chai');
var should = chai.should();
var BrokenLinkCrawler = require('../custom-modules/simple-crawler-extensions').BrokenLinkCrawler;

var registeredSites = require('../custom-modules/scheduler').registeredSites;

/* endpoints.. */
var chaiHttp = require('chai-http');

var server = require('../server.js');
var app = server.app;
// chai.use(chaiHttp);

describe('broken link crawler', function(done) {

	var crawler;

	describe('set up crawler', function() {

		crawler = new BrokenLinkCrawler({host: '192.168.0.54', uniqueUrlsOnly: false });

		crawler.initialProtocol = 'http';
		crawler.initialPath = '/';
		crawler.initialPort = 8080;
		crawler.filterByDomain = false;

		it('should test', function(done) {
			crawler.on('complete', function() {
				console.log('crawler: ', crawler);
				true.should.equal(true);
				done();
			});

			crawler.start();
		});
	});


	// describe('set up localhost', function(done) {
		// chai.request(app)
		// 	.post('/api/'+process.env.testUser+'/crawler/192.168.0.54/register')
		// 	.set('authorization', process.env.JWTaccessToken)
		// 	.send({
		// 		initialPath: "/", 
		// 		initialProtocol: "http",
		// 		useProxy: true,
		// 		proxyHostname: '192.168.0.54',
		// 		proxyPort: 8082,
		// 		crawlFrequency: 300000,
		// 		maxDepth: 0
		// 	}) 
		// 	.end(function(err, res) {
		// 		console.log('*******');
		// 		console.log('err: ', err);
		// 		console.log('res: ', res);
		// 		res.should.have.status(200);
		// 		done();
		// 	});
	// })
	// crawler.crawl(process.env.testUser, 'localhost', {}, function(site) {

	// 	console.log('site: ', site);
	// 	it('should pick up multiple bad links on the same page', function() {

	// 	});
	// });
});