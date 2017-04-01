var Promise = require('bluebird');

var promise1 = new Promise(function(resolve, reject) {
	setTimeout(function() {
		if(true) resolve('promise 1');
		else reject();
	}, 1000);
});

var promise2 = new Promise(function(resolve, reject) {
	return promise1
		.then(function(val) {
			resolve(val);
		})
		.catch(function(err) {
			reject(err);
		});
});

function test() {
	var promise = new Promise(function(resolve, reject) {
		setTimeout(function() {
			
		}, 3000);
	});
};