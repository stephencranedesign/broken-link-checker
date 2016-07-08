/* recursive check */
module.exports.recursiveCheck = function(name, val, callback, delay, max) {
	name = name || 'anonymous';
	delay = delay || 50;
	max = max || 100;

	var index = 0,
		check = function check(val, callback, delay, max) {
			setTimeout(function() {
				var valHolder = ( typeof val == 'function' ) ? val() : val;
				index++;
				if( valHolder || index > max ) { index = 0; if( callback ) callback(); return }
				else if ( valHolder == 'kill' ) return;
				else check(val, callback, delay, max); 
			}, delay);
		};
	
	check(val, callback, delay, max);
};

module.exports.loopObj = function (obj, func) {
    for (var prop in obj) {
        // skip loop if the property is from prototype
        if(!obj.hasOwnProperty(prop)) continue;
        func(obj[prop]);
    }
}

module.exports.capDecimals = function(num, duration) {
	var val = 10;
	if(duration === 2) val = 100;
	else if( duration === 3 ) val = 1000;
	else if( duration === 4 ) val = 10000;

	return Math.round(num * 100) / val;
};