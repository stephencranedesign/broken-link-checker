var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server.js');

var should = chai.should();
var app = server.app;

chai.use(chaiHttp);

describe('crawler api', function() {

	describe('status endpoint', function() {
		it('should return false message when not currently crawling', function() {
			chai.request(app)
	            .get('/api/crawler/testUrl/status')
	            .end(function(err, res) {
	            	should.equal(err, null);
	                res.should.have.status(200);
	                res.body.crawling.should.be.false;
	                res.body.host.should.equal('testUrl');
	                done();
	            });
		});

		it('should return true message when not currently crawling', function() {});
	});
	
	describe('start endpoint', function() {
		it('should begin a crawl if .isCrawling() returns false message', function() {});
		it('should not begin a crawl if .isCrawling() returns true message', function() {});
	});
});