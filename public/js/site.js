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
	var depth = $('#depth');

	crawlStart.on('click', function() {
		var url = crawlInput.val();
		$.post('/api/crawler/'+url+'/start', { initialProtocol: protocol.val(), initialPath: path.val(), initialPort: port.val(), interval: interval.val(), maxConcurrency: concurrency.val() }, function(data) {
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
			var brokenLinks = data.brokenLinks.length;
			list.html('<h4>Broken Links for Site:'+data.brokenLinks.length+'</h4><ul>'+buildList(data.brokenLinks)+'</ul></div>');
			console.log('done', data);
		});
	});
	buildList = function(list) {
		var array = [];
		list.forEach(function(val) {
			console.log('val: ', val);
			array.push('<li><p>Url: '+val.fileName+'</p> <strong>Status Code: '+val.statusCode+'</strong></li>');
		});

		return array.join('');
	};

	/* delete site */
	var deleteInput = $('#deleteInput');
	var deleteStart = $('#deleteStart');

	deleteStart.on('click', function() {
		var url = deleteInput.val();
		$.get('/api/sites/delete/'+url, function(data) {
			console.log('done', data);
		});
	});

	/* create user */
	var createUser = $('#createUser');
	var username = $('#username');
	var password = $('#password');

	createUser.on('click', function() {
		$.post('/api/users/create', { username: username.val(), password: password.val() }, function(data) {
			console.log('user created: ', data);	
		}, 'application/x-www-form-urlencoded');
	});

	var listUsers = $('#listUsers');
	listUsers.on('click', function() {
		$.get('/api/users/list', function(data) {
			console.log('data: ', data);
		});
	});

	return siteInfo;
})(jQuery);