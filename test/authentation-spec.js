var chai = require('chai');
var should = chai.should();

var chaiHttp = require('chai-http');
var server = require('../server.js');
var User = require('../models/Users').model;
var UserServices = require('../models/Users').services;
var app = server.app;
chai.use(chaiHttp);

describe('authentication endpoints', function() {
	describe('/api/user/create', function() {

		it('should error if no name or password field give in request body', function(done) {
			chai.request(app)
				.post('/api/user/create')
				.end(function(err, res) {
					res.should.have.status(401);
					should.equal(res.body.msg, "Please pass name and password.");
					should.equal(res.body.success, false);
					done();
				});
		});

		it('should create a new user if name / password defined and name is unique', function(done) {
			chai.request(app)
				.post('/api/user/create')
				.send({ name: process.env.testUser, password: process.env.testPass })
				.end(function(err, res) {
					res.should.have.status(200);
					should.equal(res.body.msg, 'Successful created new user.');
					should.equal(res.body.success, true);
					done();
				});
		});

		it('should be unsuccessful if name is not unique', function(done) {
			chai.request(app)
				.post('/api/user/create')
				.send({ name: process.env.testUser, password: process.env.testPass })
				.end(function(err, res) {
					res.should.have.status(401);
					should.equal(res.body.msg, 'Username already exists.');
					should.equal(res.body.success, false);
					done();
				});
		});
	});

	describe('/api/authenticate', function() {
		it('should fail if wrong name given in request body', function(done) {
			chai.request(app)
				.post('/api/authenticate')
				.send({ name: 'yo12' })
				.end(function(err, res) {
					res.should.have.status(401);
					should.equal(res.body.msg, "Authentication failed. User not found.");
					should.equal(res.body.success, false);
					done();
				});
		});

		it('should fail if wrong password given in request body', function(done) {
			chai.request(app)
				.post('/api/authenticate')
				.send({ name: process.env.testUser, password: 'test' })
				.end(function(err, res) {
					res.should.have.status(401);
					should.equal(res.body.msg, "Authentication failed. Wrong password.");
					should.equal(res.body.success, false);
					done();
				});
		});

		it('should return JWT access token if correct name and password given in request body', function(done) {
			chai.request(app)
				.post('/api/authenticate')
				.send({ name: process.env.testUser, password: process.env.testPass })
				.end(function(err, res) {
					res.should.have.status(200);
					should.equal(res.body.success, true);
					should.exist(res.body.token);
					should.equal(/JWT /.test(res.body.token), true);
					process.env.JWTaccessToken = res.body.token;
					done();
				});
		});
	});

	describe('/api/user/delete', function() {

		it('should need authentication', function(done) {
			chai.request(app)
				.post('/api/user/delete')
				.end(function(err, res) {
					res.should.have.status(401);
					done();
				});
		});

		it('should error if no name field give in request body', function(done) {
			chai.request(app)
				.post('/api/user/delete')
				.set('authorization', process.env.JWTaccessToken)
				.end(function(err, res) {
					res.should.have.status(200);
					should.equal(res.body.msg, "Please pass name");
					should.equal(res.body.success, false);
					done();
				});
		});

		it('should give no user message if trying to delete a user that does not exist', function(done) {
			chai.request(app)
				.post('/api/user/delete')
				.set('authorization', process.env.JWTaccessToken)
				.send({ name: "yo13" })
				.end(function(err, res) {
					res.should.have.status(200);
					should.equal(res.body.msg, 'No user with supplied Name');
					should.equal(res.body.success, false);
					done();
				});
		});

		it('should delete a user if user exists and authenticated', function(done) {
			chai.request(app)
				.post('/api/user/delete')
				.set('authorization', process.env.JWTaccessToken)
				.send({ name: process.env.testUser })
				.end(function(err, res) {
					res.should.have.status(200);
					should.equal(res.body.msg, 'Successfully deleted user');
					should.equal(res.body.success, true);
					done();
				});
		});
	});

	
	describe('preping user for rest of tests', function() {
		it('should create a user', function(done) {
			chai.request(app)
				.post('/api/user/create')
				.send({ name: process.env.testUser, password: process.env.testPass })
				.end(function(err, res) {
					res.should.have.status(200);
					should.equal(res.body.msg, 'Successful created new user.');
					should.equal(res.body.success, true);
					done();
				});
		});

		it('should set access token', function(done) {
			chai.request(app)
				.post('/api/authenticate')
				.send({ name: process.env.testUser, password: process.env.testPass })
				.end(function(err, res) {
					res.should.have.status(200);
					should.equal(res.body.success, true);
					should.exist(res.body.token);
					should.equal(/JWT /.test(res.body.token), true);
					process.env.JWTaccessToken = res.body.token;
					console.log('new token: ', process.env.JWTaccessToken);
					done();
					done2();
				});
		});
	});
});