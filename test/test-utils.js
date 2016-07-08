module.exports.asyncTimeout = function(callback, delay) {
	return new Promise(function(fulfill, reject) {
		setTimeout(function() {
			callback(fulfill, reject)
		}, delay);
	});
};