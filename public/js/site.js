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
		$.get('/api/sites/findBrokenLinks/'+url, function(data) {
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

	/* crawl site */
	var crawlInput = $('#crawlInput');
	var crawlStart = $('#crawlStart');
	var protocol = $('#protocol');
	var path = $('#path');
	var port = $('#port');
	var interval = $('#interval');
	var concurrency = $('#maxConcurrency');
	var maxDepth = $('#maxDepth');
	var crawlFrequency = $('#crawlFrequency');

	crawlStart.on('click', function() {
		var url = crawlInput.val();
		$.post('/api/crawler/'+url+'/register', { initialProtocol: protocol.val(), initialPath: path.val(), initialPort: port.val(), interval: interval.val(), maxConcurrency: concurrency.val(), crawlFrequency: crawlFrequency.val(), maxDepth: maxDepth.val() }, function(data) {
			console.log('crawl finished');
		}, 'application/x-www-form-urlencoded');
	});

	/* list site */
	var listInput = $('#listInput');
	var listStart = $('#listStart');
	var list = $('#list');

	listStart.on('click', function() {
		var url = listInput.val();
		$.get('/api/sites/find/'+url, function(data) {
			console.log('Site Info: ', data);
			var brokenLinks = data.brokenLinks.length;
			list.html('<h4>Broken Links for Site:'+data.brokenLinks.length+'</h4><p>Check console for output.</p></div>');
		});
	});
	buildList = function(list) {
		var array = [];
		list.forEach(function(val) {
			// console.log('val: ', val);
			array.push('<li><p>Url: '+val.fileName+'</p> <strong>Status Code: '+val.statusCode+'</strong></li>');
		});

		return array.join('');
	};

	/* delete site */
	var deleteInput = $('#deleteInput');
	var deleteStart = $('#deleteStart');

	deleteStart.on('click', function() {
		var url = deleteInput.val();
		console.log('url: ', url);
		$.post('/api/crawler/'+url+'/unRegister', function(data) {
			console.log('done', data);
		});
	});

	/* update a path on site */
	var updateInput = $('#updateInput');
	var updateInputPath = $('#updateInputPath');
	var updateStart = $('#updateStart');

	updateStart.on('click', function() {
		var host = updateInput.val();
		var path = updateInputPath.val();
		console.log('hi', host, path);
		$.post('/api/crawler/updatePath', { host: host, path: path }, function(data) {
			console.log('crawl finished');
		}, 'application/x-www-form-urlencoded');
	});

	/* pages */
	var pagesInput = $('#pages-input'),
		pagesButton = $('#pages-button');

	pagesButton.on('click', function() {
		$.get("/api/pages/list", function(data) {
			console.log("pages data: ", data);
			// var pages = [];
			// var ul = $('#pages');
			// data.forEach(function(o) {
			// 	pages.push("<li>"+o.url+"</li>")
			// });
			// ul.html(pages.join(''));
		});
	});

	/* resources */
	var resourcesInput = $('#resources-input'),
		resourcesButton = $('#resources-button');

	resourcesButton.on('click', function() {
		$.get("/api/resources/list", function(data) {
			console.log("resources data: ", data);
			// var resources = [];
			// var ul = $('#resources');
			// data.forEach(function(o) {
			// 	resources.push("<li>"+o.url+"</li>")
			// });
			// ul.html(resources.join(''));
		});
	});

	return siteInfo;
})(jQuery);