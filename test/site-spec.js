var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var Site = require("../custom-modules/Site.js").Site;
var asyncTimeout = require("./test-utils.js").asyncTimeout;

var should = chai.should();

chai.use(chaiAsPromised);

function MockQueueItem(baseUrl, path, status, referrer) {
	this.url = baseUrl+path;
	protocol = "http";
	host = "host";
	port = "8080";
	path = path;
	uriPath =  "uriPath";
	depth = 0;
	fetched = true;
	status = status;
	stateData = {};
	if(referrer) this.referrer = referrer;
}

describe("Site api", function() {
	describe("constructor", function() {
		var instance
		it('should create a fresh instance with url set to first parameter', function() {
			instance = new Site("test.com", 300, {});
			instance.should.be.a('object');
			instance["url"].should.be.equal("test.com");
		});
	});

	describe("_groupByPages", function() {
		it("should filter .links array into pages object based on referrer", function() {
			instance = new Site("test.com", 300, {});
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
});