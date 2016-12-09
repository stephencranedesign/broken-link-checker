var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var recursiveCheck = require("../custom-modules/utils.js").recursiveCheck;
var asyncTimeout = require("./test-utils.js").asyncTimeout;

var should = chai.should();

chai.use(chaiAsPromised);

describe("recursiveCheck", function () {
	var boom = 0,
		bam = 0;

	recursiveCheck(function() {
		return boom;
	}).then(function() {
		bam = 1;
	});

	setTimeout(function() {
		boom = 1;
	}, 500);

	it("should fire callback when above function returns true", function() {
		return asyncTimeout(function(fulfill, reject) {
			if(bam.should.equal(1)) fulfill();
			else reject();
		}, 1000);
	});	
});

