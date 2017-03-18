var chai = require('chai');
var should = chai.should();
var crawler = require('../custom-modules/crawler.js');
var sinon = require('sinon');
var siteFromDb = require('./test-utils').siteFromDb;

var registeredSites = require('../custom-modules/scheduler').registeredSites;

/* endpoints.. */
var chaiHttp = require('chai-http');
var server = require('../server.js');
var app = server.app;
chai.use(chaiHttp);

describe('crawler endpoints', function() {
	describe('/api/crawler/status', function() {
		it('should return false message when not currently crawling', function(done) {
			chai.request(app)
				.get('/api/crawler/status')
				.end(function(err, res) {
					res.should.have.status(200);
					should.equal(res.body.status, "idle");
					done();
				});
		});
	});

	describe('/api/:user/crawler/:host/register', function() {
		it('should return a 401 status code if sent with wrong JWT authorization token', function(done) {
			chai.request(app)
				.post('/api/'+process.env.testUser+'/crawler/'+process.env.testHost+'/register')
				.end(function(err, res) {
					res.should.have.status(401);
					done();
				});
		});

		it('should return a 200 status code if sent with correct JWT authorization token ', function(done) {
			console.log('authorization token used: ', process.env.JWTaccessToken);
			chai.request(app)
				.post('/api/'+process.env.testUser+'/crawler/'+process.env.testHost+'/register')
				.set('authorization', process.env.JWTaccessToken)
				.send({
					initialPath: "/", 
					initialProtocol: "http",
					crawlFrequency: 300000,
					maxDepth: 0
				}) 
				.end(function(err, res) {
					res.should.have.status(200);
					// console.log("%%%%", res.msg);
					// console.log('registeredSites: ', registeredSites);
					registeredSites.should.have.property(process.env.testUser+"::"+process.env.testHost);
					done();
				});
		});
	});

	describe('/api/:user/crawler/:host/unRegister', function() {
		it('should return a 401 status code if sent with wrong JWT authorization token', function(done) {
			chai.request(app)
				.post('/api/'+process.env.testUser+'/crawler/'+process.env.testHost+'/unRegister')
				.end(function(err, res) {
					res.should.have.status(401);
					done();
				});
		});

		it('should return a 200 status code if sent with correct JWT authorization token, remove from registeredSites obj, & successfully remove site from db', function(done) {
			chai.request(app)
				.post('/api/'+process.env.testUser+'/crawler/'+process.env.testHost+'/unRegister')
				.set('authorization', process.env.JWTaccessToken)
				.end(function(err, res) {
					res.should.have.status(200);
					registeredSites.should.not.have.property(process.env.testUser+"::"+process.env.testHost);
					done();
				});
		});
	});
});