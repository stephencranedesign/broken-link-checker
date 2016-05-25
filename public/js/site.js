var siteInfo = (function($) {
	var urlInput = $('#urlInput');
	var info = $('#info');
	var url = $('#url');
	var fileType = $('#fileType');
	var errorCode = $('#errorCode');

	var siteInfo = null;

	info.on('click', function(e) {
		var url = urlInput.val();
		console.log('url: ', url);
		$.get('/sites/findBrokenLinks/'+url, function(data) {
			siteInfo = data;
			console.log(siteInfo);
		});
	});

	url.on('click', function() {
		siteInfo.brokenLinks.forEach(function(obj) {
			console.log('by url: ', obj);
		});
	});

	fileType.on('click', function() {
		siteInfo.brokenLinks.forEach(function(obj) {
			console.log('by fileType: ', obj);
		});
	});

	errorCode.on('click', function() {
		siteInfo.brokenLinks.forEach(function(obj) {
			console.log('by errorCode: ', obj);
		});
	});

	return siteInfo;
})(jQuery);