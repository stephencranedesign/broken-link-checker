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