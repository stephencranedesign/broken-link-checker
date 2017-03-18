var chai = require('chai');
var should = chai.should();

var MockResource = require('./test-utils.js').MockResource;
var MockQueueItem = require('./test-utils.js').MockQueueItem;

var crawlerCtrl = require('../controllers/crawler-controller.js');
var recursiveCheck = require("../custom-modules/utils").recursiveCheck;
var fillPages = require("./test-utils").fillPages;
var MockPage = require('./test-utils').MockPage;
var fillResources = require("./test-utils").fillResources;

var siteFromDb = require('./test-utils').siteFromDb;

var SitesService = require('../services/sites');
var PagesService = require('../services/pages');
var ResourcesService = require('../services/resources');

/* endpoints.. */
var chaiHttp = require('chai-http');
var server = require('../server.js');
var app = server.app;
chai.use(chaiHttp);

var Promise = require('bluebird');

function getPages(user, host) {
	return new Promise(function(resolve, reject) {
		PagesService.list(user, host, function(pages) {
			resolve(pages);
		}, function(err) {
			reject(err);
		});
	});
}
function getResources(user, host) {
	return new Promise(function(resolve, reject) {
		ResourcesService.list(user, host, function(pages) {
			resolve(pages);
		}, function(err) {
			reject(err);
		});
	});
}
function getSite(user, host) {
	return new Promise(function(resolve, reject) {
		SitesService.findSite(user, host, function(siteFromDb) {
			resolve(siteFromDb);
		}, function(err) {
			reject(err);
		});
	});
}

describe('crawler controller', function() {

	describe('save()', function() {
			var site = siteFromDb({});

			site.pages = [
				MockPage("/test", ["/"]),
				MockPage("/test-2", ["/"]),
				MockPage("/test-3", ["/"]),
				MockPage("/test-4", ["/"]),
				MockPage("/test-5", ["/"])
			];

			site.resources = [
				MockResource("/test", true, "/"),
				MockResource("/test-2", true, "/"),
				MockResource("/test-3", true, "/"),
				MockResource("/test-4", true, "/"),
				MockResource("/test-5", true, "/")
			];

			site.brokenResources = [
				'test-1',
				'test-2',
				'test-3'
			];

		it('saving site..', function() {
			// save site
			return crawlerCtrl.saveSite(site.user, site)
				.then(function(obj) {
					obj.should.deep.equal({
						message: "site successfully crawled",
						status: 0,
						err: null
					});
				});
		});


		it('should save pages', function() {
			return getPages(process.env.testUser, process.env.testHost)
				.then(function(pages) {
					console.log('pages');
					pages.length.should.equal(5);
				});
		});
		it('should save resource', function() {
			return getResources(process.env.testUser, process.env.testHost)
				.then(function(resources) {
					console.log('resources');
					resources.length.should.equal(5);
				});
		});
		it('should save to sites', function() {
			return getSite(process.env.testUser, process.env.testHost)
				.then(function(siteFromDb) {
					console.log('sites::', siteFromDb);
					siteFromDb.site.brokenResources.should.equal(3);
				});
		});
	});

	describe('clearPagesAndResourcesForSite()', function() {
		it('should delete all pages and resources in db for a specified user and url', function() {

			return fillPages().then(fillResources).then(function() {
					return crawlerCtrl.clearPagesAndResourcesForSite(process.env.testUser, process.env.testHost, function(obj) {
						resolve(obj);
					}, function(err) {
						reject(err);
					});
				}).then(function(obj) {
					obj.should.deep.equal({
						message: "site successfully crawled",
						status: 1,
						err: null
					});
			    });
		});
	});

});