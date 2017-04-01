var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var Site = require("../custom-modules/Site.js").Site;
var OffendersList = require("../custom-modules/Offenders.js").List;
var asyncTimeout = require("./test-utils.js").asyncTimeout;
var Resource = require("../custom-modules/Resource");

var should = chai.should();

chai.use(chaiAsPromised);

function MockQueueItem(baseUrl, path, status, referrer) {
	this.url = baseUrl+path;
	this.protocol = "http";
	this.host = "host";
	this.port = "8080";
	this.path = path;
	this.uriPath =  "uriPath";
	this.depth = 0;
	this.fetched = true;
	this.status = status;
	this.stateData = {};

	if(referrer) this.referrer = referrer;

	return this;
}

function MockResource(baseUrl, path, status, referrer) {
	var queueItem = new MockQueueItem(baseUrl, path, status, referrer);
	return new Resource(process.env.testUser, process.env.testHost, false, queueItem);
}

describe("Site api", function() {
	describe("constructor", function() {
		var instance
		it('should create a fresh instance when user set to first parameter and host url as second parameter', function() {
			instance = new Site(process.env.testUser, "test.com", 300, {});
			instance.should.be.a('object');
			instance["url"].should.be.equal("test.com");
		});
	});
	
	describe('_findWorstOffenders', function() {
		var instance = new Site(process.env.testUser, "test.com", 300, {});

		instance.brokenResources = [];
		
		instance.brokenResources.push(MockResource("test.com", "/about.aspx", "failed", "/home.aspx"));
		instance.brokenResources.push(MockResource("test.com", "/project.aspx", "failed"));
		instance.brokenResources.push(MockResource("test.com", "/about.aspx", "failed", "/project.aspx"));

		it("a new site should have no property worstBrokenLinks defined", function() {
			should.equal(instance.worstOffenders, undefined);
		});

		it("sort the broken links array and return top 5 to worstOffenders array", function() {
			
			instance._findWorstOffenders();

			console.log('est: ', instance.worstOffenders);
			should.not.equal(instance.worstOffenders, undefined);
			instance.worstOffenders[0].url.should.equal(instance.url + "/about.aspx");
			instance.worstOffenders[0].length.should.equal(2);
			instance.worstOffenders[1].url.should.equal(instance.url + "/project.aspx");
		})
	});

	describe("_isWhiteListed", function() {
		var instance = new Site(process.env.testUser, "test.com", 300, {});
		instance.whitelistedUrls = ["www.google.com"];

		it("should return true if parameter passed is in whitelistedUrls array", function() {
			var result = instance._isWhiteListed("www.google.com");
			result.should.be.equal(true);
		});

		it("should return false if parameter passed is not in whitelistedUrls array", function() {
			var result = instance._isWhiteListed("www.bluecompass.com");
			result.should.be.equal(false);
		});
	});

	describe("whiteListAddUrl", function() {
		var instance = new Site(process.env.testUser, "test.com", 300, {});

		it("should add passed string paramter to whitelistedUrls array", function() {
			instance.whiteListAddUrl("www.google.com");

			instance.whitelistedUrls.length.should.equal(1);
		});

		it("should concat passed array paramter to whitelistedUrls array", function() {
			instance.whiteListAddUrl(["www.bluecompass.com", "www.facebook.com"]);

			instance.whitelistedUrls.length.should.equal(3);
		});

		it("should keep whitelistedUrls unique", function() {
			instance.whiteListAddUrl("www.google.com");
			instance.whitelistedUrls.length.should.equal(3);

			instance.whiteListAddUrl(["www.bluecompass.com", "www.facebook.com"]);
			instance.whitelistedUrls.length.should.equal(3);
		});
	});

	describe("_isBrokenResource", function() {
		var instance = new Site(process.env.testUser, "test.com", 300, {});

		var resourceFailed = new MockQueueItem("test.com", "/about.aspx", "failed");
		var resourceNotFound = new MockQueueItem("test.com", "/about2.aspx", "notfound");

		console.log("resourceFailed: ", resourceFailed);
		console.log("resourceNotFound: ", resourceNotFound);

		console.log("instance.whitelistedUrls: ", instance.whitelistedUrls);

		it("should return true if passed resource.url has not been added to whitelistedUrls array and resource.status is failed", function() {
			var result = instance._isBrokenResource(resourceFailed.status);
			result.should.be.true;
		});

		it("should return true if passed resource.url has not been added to whitelistedUrls array and resource.status is notfound", function() {
			var result = instance._isBrokenResource(resourceNotFound.staus);
			result.should.be.true;
		});
		
		it("should return false if passed resource.url has been added to whitelistedUrls array and resource.status is failed", function() {
			instance.whiteListAddUrl("test.com/about.aspx");
			instance.whiteListAddUrl("test.com/about2.aspx");

			var result = instance._isBrokenResource(resourceFailed.status);
			result.should.be.false;
		});

		it("should return false if passed resource.url has been added to whitelistedUrls array and resource.status is notfound", function() {
			var result = instance._isBrokenResource(resourceNotFound.status);
			result.should.be.false;
		});
	});
});

describe("OffendersList", function() {
	describe("constructor", function() {
		var list = new OffendersList();
		it("should have an empty array", function() {
			list.array.should.be.a('array');
		});
	});

	describe("isInArray", function() {
		var list = new OffendersList();
		var index = list.isInArray('prop', 0);
		it("should return -1 when prop of object not in array", function() {
			index.should.be.equal(-1);
		});

		it("should return index of found object if in array", function() {
			list.array.push({ prop: 1 });
			list.array.push({ prop: 2 });
			list.array.push({ prop: "hi" });

			index = list.isInArray('prop', 2);
			var val = list.isInArray('prop', "hi");

			index.should.be.equal(1);
			val.should.be.equal(2);
		});
	});

	describe("sort", function() {
		var list = new OffendersList();
		list.addItem({ prop: 1 });
		list.addItem({ prop: 2 });
		list.addItem({ prop: 5 });
		list.addItem({ prop: 3 });

		it("should sort values of array by property provided from least to greatest if second property not passed true", function() {
			list.sortByProp('prop');

			list.array[0].prop.should.equal(1);
			list.array[1].prop.should.equal(2);
			list.array[2].prop.should.equal(3);
			list.array[3].prop.should.equal(5);
		});

		it("should sort values of array by property provided from greatest to least if second property passed true", function() {
			list.sortByProp('prop', true);

			list.array[0].prop.should.equal(5);
			list.array[1].prop.should.equal(3);
			list.array[2].prop.should.equal(2);
			list.array[3].prop.should.equal(1);
		});
	});

});