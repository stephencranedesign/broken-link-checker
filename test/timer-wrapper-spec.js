var chai = require("chai");
var TimerWrapper = require("../custom-modules/TimerWrapper.js");

var should = chai.should();

describe("TimerWrapper", function() {
	describe("start()", function() {
		it("should start the timer and fire a function after supplied tick", function() {

			var index = 0;

			var callbackPromise = function(callback) {
				index = index + 1;
				callback(false);
			};

			function test() {
			  	return new Promise(function (resolve, reject) {
			  		var timer = new TimerWrapper(0.5);

					timer.setCallback(callbackPromise);
					timer.start();

					setTimeout(function() {
						resolve(index);
					}, 1000);
			  	});
			}



			return test().then(function(result) {
				result.should.be.equal(1);
			});
		});

		it("should fire callback repeatedly if stop() not called", function() {

			var index = 0;

			var callbackPromise = function(callback) {
				index = index + 1;
				console.log('callbackPromise: ', index);
				if(index === 2) callback(false);
				else callback(true);
			};

			function test() {

			  	return new Promise(function (resolve, reject) {
			  		var timer = new TimerWrapper(0.5);
					
					timer.setCallback(callbackPromise);
					timer.start();

					setTimeout(function() {
						resolve(index);
					}, 1500);
			  	});
			}



			return test().then(function(result) {
				result.should.be.equal(2);
			});
		});
	});

	describe("stop()", function() {
		it("should stop callback firing repeatedly if stop() called", function() {

			var index = 0;

			var callbackPromise = function(callback) {
				index = index + 1;
				if(index === 1) callback(false);
			};

			function test() {
			  	return new Promise(function (resolve, reject) {
			  		var timer = new TimerWrapper(0.5);
					
					timer.setCallback(callbackPromise);
					timer.start();

					setTimeout(function() {
						resolve(index);
					}, 1500);
			  	});
			}



			return test().then(function(result) {
				result.should.be.equal(1);
			});
		});
	});

	describe("when attached to another object", function() {
		describe("start()", function() {
			it("should start the timer and fire a function after supplied tick", function() {

				var index = 0;

				var callbackPromise = function(callback) {
					index = index + 1;
					callback(false);
				};

				function test() {
				  	return new Promise(function (resolve, reject) {
				  		var o = {};
				  		o.timer = new TimerWrapper(0.5);
						
						o.timer.setCallback(callbackPromise);
						o.timer.start();

						setTimeout(function() {
							resolve(index);
						}, 1000);
				  	});
				}



				return test().then(function(result) {
					result.should.be.equal(1);
				});
			});

			it("should fire callback repeatedly if stop() not called", function() {

				var index = 0;

				var callbackPromise = function(callback) {
					index = index + 1;
					console.log('callbackPromise: ', index);
					if(index === 2) callback(false);
					else callback(true);
				};

				function test() {
				  	return new Promise(function (resolve, reject) {
				  		var o = {};
				  		o.timer = new TimerWrapper(0.5);
						
						o.timer.setCallback(callbackPromise);
						o.timer.start();

						setTimeout(function() {
							resolve(index);
						}, 1500);
				  	});
				}



				return test().then(function(result) {
					result.should.be.equal(2);
				});
			});
		});

		describe("stop()", function() {
			it("should stop callback firing repeatedly if stop() called", function() {

				var index = 0;

				var callbackPromise = function(callback) {
					index = index + 1;
					if(index === 1) callback(false);
				};

				function test() {
				  	return new Promise(function (resolve, reject) {
				  		var o = {};
				  		o.timer = new TimerWrapper(0.5);
						
						o.timer.setCallback(callbackPromise);
						o.timer.start();

						setTimeout(function() {
							resolve(index);
						}, 1500);
				  	});
				}



				return test().then(function(result) {
					result.should.be.equal(1);
				});
			});
		});
	});
});