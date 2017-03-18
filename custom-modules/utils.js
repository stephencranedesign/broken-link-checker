/* recursive check */
module.exports.recursiveCheck = function(val, delay, max) {
	delay = delay || 50;
	max = max || 100;

	return new Promise(function(fulfill, reject) {
		var index = 0,
		check = function check(val, delay, max) {
			setTimeout(function() {
				var valHolder = ( typeof val === 'function' ) ? val() : val;
				console.log("check", valHolder);
				index++;
				if( valHolder || index > max ) { fulfill(); return }
				else if ( valHolder == 'kill' ) reject();
				else check(val, delay, max); 
			}, delay);
		};

		check(val, delay, max);
	});
};

module.exports.loopObj = function (obj, func) {
    for (var prop in obj) {
        // skip loop if the property is from prototype
        if(!obj.hasOwnProperty(prop)) continue;
        func(prop, obj[prop]);
    }
}

module.exports.capDecimals = function(num, duration) {
	var val = 10;
	if(duration === 2) val = 100;
	else if( duration === 3 ) val = 1000;
	else if( duration === 4 ) val = 10000;

	return Math.round(num * 100) / val;
};

module.exports.normalizeUrl = function (url) {
	if(url === undefined) throw new Error('url needs to be a string');
    // regex to normalize entries somehow?
    var clean = url.replace('http://', '').replace('https://', '').replace('www.', '');
    return "www."+clean;
};