var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
var scheduler = require('../custom-modules/scheduler.js');
var asyncTimeout = require('./test-utils.js').asyncTimeout;
var flushDb = require("./test-utils.js").flushDb;

// var should = chai.should();

// chai.use(chaiAsPromised);

var fakeSite = {
	url: 'test.org',
    uId: 0,
    user: process.env.testUser,
    links: [],
    brokenLinks: [],
    crawlFrequency: 1,
    crawlOptions: {},
    callback: function() {}
};

describe('scheduler api', function() {
	describe('registerSite', function() {
		it('should set a property on registeredSites object', function() {
			scheduler.registerSite(fakeSite, false, function() {}, function() {});
			scheduler.registeredSites[fakeSite.user+"::"+fakeSite.url].should.be.an('object');
		});
	});
	// describe('unRegisterSite', function() {
	// 	it('should remove key from registeredSites object', function() {
	// 		console.log(scheduler.registeredSites);
	// 		scheduler.unRegisterSite(fakeSite.user, fakeSite.url);

	// 		should.equal(scheduler.registeredSites[fakeSite.user+"::"+fakeSite.url], undefined);
	// 	});
	// });
});