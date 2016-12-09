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
    links: [],
    brokenLinks: [],
    crawlFrequency: 1,
    crawlOptions: {},
    callback: function() {}
};

describe('scheduler api', function() {
	describe('SiteStub', function() {
		var instance;
		it('should create a fresh instance with constructor', function() {
			var index = 0;
			instance = new scheduler.SiteStub(fakeSite, fakeSite.callback);
			fakeSite.should.be.a('object');
			instance.should.include.keys('url', 'crawlFrequency', 'lastCrawl', 'crawlOptions', 'timer', 'callback');
		});
		describe('startTimer', function() {
			it('should register a callback to fire with .startTimer when calling constructor', function() {
				var index = 0;
				function callback() {
					index++;
				};
				index.should.equal(0);
				instance = new scheduler.SiteStub(fakeSite, callback);

				return asyncTimeout(function(fulfill) {
					if(index.should.equal(1)) fulfill();
					else reject();
				}, 1500);
			});
		});
		describe('stopTimer', function() {
			it('should cancel timer', function() {
				var index = 0;
				function callback() {
					index++;
				};
				index.should.equal(0);
				instance = new scheduler.SiteStub(fakeSite, callback);
				instance.stopTimer();
				return asyncTimeout(function(fulfill) {
					if(index.should.equal(0)) fulfill();
					else reject();
				}, 1500);
			});
		});
	});
	describe('registerSite', function() {
		it('should set a property on registeredSites object', function() {
			scheduler.registerSite(fakeSite);
			scheduler.registeredSites[instance.url].should.be.an('object');
		});
	});
	describe('unRegisterSite', function() {
		it('should remove key from registeredSites object', function() {
			scheduler.registerSite(fakeSite);
			scheduler.registeredSites[instance.url].should.be.an('object');

			scheduler.unRegisterSite(instance.url);
			should.equal(scheduler.registeredSites[instance.url], undefined);
		});
	});
});