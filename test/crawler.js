var chai = require('chai');
var should = chai.should();
var crawler = require('../custom-modules/crawler.js');
var sinon = require('sinon');
var siteFromDb = require('./test-utils').siteFromDb;

describe('removeLinksForReferrer', function() {

});

// describe('crawler api', function() {
// 	describe('crawl', function() {
// 		var discoverResources = false;
// 		var onCalled = [];
// 		var startCalled = false;

// 		var CrawlerStub = function() {
// 			console.log('yo');
// 			return this;
// 		};
// 		CrawlerStub.prototype.discoverResources = function() { discoverResources = true; };
// 		CrawlerStub.prototype.on = function(name, func) { onCalled.push(name); };
// 		CrawlerStub.prototype.start = function() { startCalled = true; };

// 		spy = sinon.spy(CrawlerStub);
// 		crawler.mockCrawler(spy);
// 		crawler.crawl('www.test.org', {}, function() {}, function() {});
// 		it('should have fired discoverResources function', function() {
// 			discoverResources.should.be.true;
// 		});
// 	});
// });

/* endpoints.. */
var chaiHttp = require('chai-http');
var server = require('../server.js');
var app = server.app;
chai.use(chaiHttp);

// describe('crawler endpoints', function() {
// 	describe('status endpoint', function() {
// 		it('should return false message when not currently crawling', function(done) {
// 			chai.request(app)
// 				.get('/api/crawler/testUrl/status')
// 				.end(function(err, res) {
// 					res.should.have.status(200);
// 					should.equal(res.body.crawling, false);
// 					should.equal(res.body.host, 'testUrl');
// 					done();
// 				});
// 		});
// 		// it('should return true message when currently crawling', function(done) {
// 		// 	chai.request(app)
// 		// 		.get('/api/crawler/cerneCalcium/register')
// 		// 		.end(function(err, res) {
// 		// 			chai.request(app)
// 		// 				.get('/api/crawler/testUrl/status')
// 		// 				.end(function(err, res) {
// 		// 					res.should.have.status(200);
// 		// 					should.equal(res.body.crawling, true);
// 		// 					should.equal(res.body.host, 'testUrl');
// 		// 					done();
// 		// 				});
// 		// 		});
// 		// });
// 	});
// });