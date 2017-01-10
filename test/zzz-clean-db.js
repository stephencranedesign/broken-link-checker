var chai = require('chai');
var should = chai.should();

var UserServices = require('../models/Users').services;
var PagesServices = require('../services/pages');
var ResourcesServices = require('../services/resources');
var SitesServices = require('../services/sites');

describe('cleaning dbs', function() {
	it('should drop users', function(done) {
		UserServices.drop(function(err) {
			if(err) console.error('error dropping users', err);
			else console.log('users dropped');
			done();
		});
	});
	it('should drop pages', function(done) {
		PagesServices.drop(function(err) {
			if(err) console.error('error dropping pages', err);
			else console.log('users dropped');
			done();
		});
	});
	it('should drop resources', function(done) {
		ResourcesServices.drop(function(err) {
			if(err) console.error('error dropping users', err);
			else console.log('users dropped');
			done();
		});
	});
	it('should drop sites', function(done) {
		SitesServices.drop(function(err) {
			if(err) console.error('error dropping resources', err);
			else console.log('users dropped');
			done();
		});
	});
});