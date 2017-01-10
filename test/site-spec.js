var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var Site = require("../custom-modules/Site.js").Site;
var OffendersList = require("../custom-modules/Site.js").OffendersList;
var asyncTimeout = require("./test-utils.js").asyncTimeout;

var should = chai.should();

chai.use(chaiAsPromised);

function MockQueueItem(baseUrl, path, status, referrer) {
	this.info = {
		url: baseUrl+path,
		protocol: "http",
		host: "host",
		port: "8080",
		path: path,
		uriPath:  "uriPath",
		depth: 0,
		fetched: true,
		status: status,
		stateData: {}
	};
	
	if(referrer) this.info.referrer = referrer;
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

	describe("_groupByPages", function() {
		it("should filter .links array into pages object based on referrer", function() {
			var instance = new Site(process.env.testUser, "test.com", 300, {});
			instance.links = [

				// home page
				new MockQueueItem("test.com", "/about.aspx", "downloaded"),
				new MockQueueItem("test.com", "/about.aspx", "downloaded"),
				new MockQueueItem("test.com", "/contact.aspx", "downloaded"),
				new MockQueueItem("test.com", "/work.aspx", "downloaded"),
				new MockQueueItem("test.com", "/blog.aspx", "downloaded"),
				new MockQueueItem("test.com", "/news.aspx", "downloaded"),

				// about page
				new MockQueueItem("test.com", "/contact.aspx", "downloaded", "/about.aspx"),
				new MockQueueItem("test.com", "/contact.aspx", "downloaded", "/about.aspx"),
				new MockQueueItem("test.com", "/work.aspx", "downloaded", "/about.aspx"),
				new MockQueueItem("test.com", "/blog.aspx", "downloaded", "/about.aspx"),
				new MockQueueItem("test.com", "/news.aspx", "downloaded", "/about.aspx"),

				// contact page
				new MockQueueItem("test.com", "/about.aspx", "downloaded", "/contact.aspx"),
				new MockQueueItem("test.com", "/work.aspx", "downloaded", "/contact.aspx"),
				new MockQueueItem("test.com", "/blog.aspx", "downloaded", "/contact.aspx"),
				new MockQueueItem("test.com", "/news.aspx", "downloaded", "/contact.aspx"),

				// work page
				new MockQueueItem("test.com", "/about.aspx", "downloaded", "/work.aspx"),
				new MockQueueItem("test.com", "/contact.aspx", "downloaded", "/work.aspx"),
				new MockQueueItem("test.com", "/blog.aspx", "downloaded", "/work.aspx"),
				new MockQueueItem("test.com", "/news.aspx", "downloaded", "/work.aspx"),

				// blog page
				new MockQueueItem("test.com", "/about.aspx", "downloaded", "/blog.aspx"),
				new MockQueueItem("test.com", "/contact.aspx", "downloaded", "/blog.aspx"),
				new MockQueueItem("test.com", "/work.aspx", "downloaded", "/blog.aspx"),
				new MockQueueItem("test.com", "/news.aspx", "downloaded", "/blog.aspx"),

				// news page
				new MockQueueItem("test.com", "/about.aspx", "downloaded", "/news.aspx"),
				new MockQueueItem("test.com", "/contact.aspx", "downloaded", "/news.aspx"),
				new MockQueueItem("test.com", "/work.aspx", "downloaded", "/news.aspx"),
				new MockQueueItem("test.com", "/blog.aspx", "downloaded", "/news.aspx"),

				new MockQueueItem("test.com", "/news-2.aspx", "downloaded", "/about.aspx"),
			];

			instance._groupByPages();
		});
	});
	
	describe('_findWorstBrokenLinks', function() {
		var instance = new Site(process.env.testUser, "test.com", 300, {});

		instance.brokenResources = [];
		
		instance.brokenResources.push(new MockQueueItem("test.com", "/about.aspx", "failed", "/home.aspx"));
		instance.brokenResources.push(new MockQueueItem("test.com", "/project.aspx", "failed"));
		instance.brokenResources.push(new MockQueueItem("test.com", "/about.aspx", "failed", "/project.aspx"));

		it("a new site should have no property worstBrokenLinks defined", function() {
			should.not.exist(instance.worstOffenders);
		});

		it("sort the broken links array and return top 5 to worstOffenders array", function() {
			
			instance._findWorstBrokenLinks();

			should.exist(instance.worstOffenders);
			instance.worstOffenders[0].path.should.equal("/about.aspx");
			instance.worstOffenders[0].length.should.equal(2);
			instance.worstOffenders[1].path.should.equal("/project.aspx");
		})
	})
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