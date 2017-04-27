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
		$.get('/api/'+USER+'/sites/findBrokenLinks/'+url, function(data) {
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
		api(function() {
			$.ajax({
			  type: "POST",
			  url: '/api/'+USER+'/crawler/'+url+'/register',
			  data: {
				initialProtocol: protocol.val(), 
				initialPath: path.val(), 
				port: port.val(), 
				interval: interval.val(), 
				maxConcurrency: concurrency.val(), 
				crawlFrequency: crawlFrequency.val(), 
				maxDepth: maxDepth.val()
			  },
			  headers: { authorization: TOKEN },
			  success: function(data) { console.log('crawl finished: ', data); }
			});
		});
	});

	/* list site */
	var listInput = $('#listInput');
	var listStart = $('#listStart');
	var list = $('#list');

	listStart.on('click', function() {
		var url = listInput.val();
		$.get('/api/'+USER+'/sites/find/'+url, function(data) {
			console.log('Site Info: ', data);
			var brokenLinks = data.brokenLinks.length;
			list.html('<h4>Broken Links for Site:'+data.brokenLinks.length+'</h4><p>Check console for output.</p></div>');
		});
	});

	/* list site */
	var brokenLinksInput = $('#brokenLinksInput');
	var brokenLinksStart = $('#brokenLinksStart');
	// var brokenLinks = $('#brokenLinks');

	brokenLinksStart.on('click', function() {
		var url = brokenLinksInput.val();
		$.get('/api/'+USER+'/resources/'+url+'/brokenLinks', function(data) {
			console.log('brokenLinks Info: ', data);
			// var brokenLinks = data.brokenLinks.length;
			// brokenLinks.html('<h4>Broken Links for Site:'+data.brokenLinks.length+'</h4><p>Check console for output.</p></div>');
		});
	});

	/* list site */
	var brokenLinksFromHost = $('#brokenLinksFromHost');
	var brokenLinksFromHostStart = $('#brokenLinksFromHostStart');
	var brokenLinksFrom = $('#brokenLinksFrom');
	var brokenLinksTo = $('#brokenLinksTo');
	// var brokenLinks = $('#brokenLinks');

	brokenLinksFromHostStart.on('click', function() {
		var url = brokenLinksFromHost.val();
		$.get('/api/'+USER+'/resources/'+url+'/brokenLinks/'+brokenLinksFrom.val()+'/'+brokenLinksTo.val(), function(data) {
			console.log('brokenLinks Info: ', data.length, data);
			// var brokenLinks = data.brokenLinks.length;
			// brokenLinks.html('<h4>Broken Links for Site:'+data.brokenLinks.length+'</h4><p>Check console for output.</p></div>');
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
		api(function() {
			$.ajax({
			  type: "POST",
			  url: '/api/'+USER+'/crawler/'+url+'/unRegister',
			  headers: { authorization: TOKEN },
			  success: function(data) { console.log('site unRegistered: ', data); }
			});
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
		api(function() {
			$.post('/api/'+USER+'/crawler/updatePath', { host: host, path: path, authenticate: TOKEN }, function(data) {
				console.log('crawl finished');
			}, 'application/x-www-form-urlencoded');
		});
	});

	/* white list */
	var whiteListBtn = $('#whiteListBtn'),
		whiteListHost = $('#whiteListHost'),
		whiteListUrl = $('#whiteListUrl');

	whiteListBtn.on('click', function() {
		api(function() {
			$.ajax({
			  type: "POST",
			  url: '/api/'+USER+'/resources/whitelist',
			  data: {
				host: whiteListHost.val(),
				urls: whiteListUrl.val()
			  },
			  headers: { authorization: TOKEN },
			  success: function(data) { console.log('whitelist good: ', data); }
			});
		});
	});

	/* remove */
	var removeBtn = $('#removeBtn'),
		removeHost = $('#removeHost'),
		removeReferrer = $('#removeReferrer'),
		removeUrl = $('#removeUrl');

	removeBtn.on('click', function() {
		api(function() {
			$.ajax({
			  type: "POST",
			  url: '/api/'+USER+'/resources/remove',
			  data: {
				host: removeHost.val(),
				url: removeUrl.val(),
				referrer: removeReferrer.val()
			  },
			  headers: { authorization: TOKEN },
			  success: function(data) { console.log('remove good: ', data); }
			});
		});
	});

	/* pages */
	var pagesInput = $('#pages-input'),
		pathInput = $('#path-input'),
		pagesButton = $('#pages-button');

	pagesButton.on('click', function() {

		var host = pagesInput.val(),
			path = pathInput.val();

		if(path === "") {
			api(function() {
				$.get("/api/"+USER+"/pages/"+host+"/list", function(data) {
					console.log("pages data: ", data);
				});
			});
		}
		else {
			api(function() {
				$.post("/api/"+USER+"/pages/"+host+"/getPath", { path: path },function(data) {
					console.log("pages data: ", data);
				});
			});
		}
	});

	/* resources */
	var resourcesInput = $('#resources-input'),
		resourcesButton = $('#resources-button');

	resourcesButton.on('click', function() {
		api(function() {
			$.get("/api/"+USER+"/resources/"+resourcesInput.val()+"/list", function(data) {
				console.log("resources data: ", data);
			});
		});
	});

	var newusername = $('#newusername'),
		newpassword = $('#newpassword'),
		newuser = $('#newuser');

	newuser.on('click', function() {
		var user = newusername.val();
		var pass = newpassword.val();

		$.ajax({ 
			url: "/api/user/create", 
			type: "POST",
			data: {
				name: user, password: pass
			}, 
			success: function(data) {
				console.log('data: ', data);
			},
			error: function(err) {
				console.log('err: ', err);
			}
		});
	});

	var username = $('#username');
	var password = $('#password');
	var login = $('#login');
	var loginWrapper = $('#login-wrapper');
	var loggedInStuff = $('#logged-in-stuff');

	login.on('click', function(e) {
		e.preventDefault();
		var user = username.val();
		var pass = password.val();

		authenticate(user, pass, function(data) {
			if(data.success) {
				TOKEN = data.token;
				USER = user;
				console.log('logged in as: ', user);
				logInState(true);
			}
			else alert(data.msg);
		}, function(err) {
			console.log('err: ', err);
			alert(err.msg);
		});
	});

	function logInState(val) {
		if(val) {
			loginWrapper.hide();
			loggedInStuff.show();
		}
		else {
			loginWrapper.show();
			loggedInStuff.hide();
		}
	}

	// user: "stephen" | pass: "password"
	var TOKEN = null;
	var USER = null;
	function authenticate(user, pass, callback, errback) {
		console.log('authenticate', user, pass);
		$.ajax({
		  type: "POST",
		  url: '/api/authenticate',
		  data: {
			name: user, password: pass
		  },
		  success: callback,
		  error: errback
		});
		// $.post('/api/authenticate', {
		// 	name: user, password: pass
		// }, 'application/x-www-form-urlencoded')
		// .done(callback)
		// .fail(errback);
	};

	function api(callback, errback) {
		if(!TOKEN) {
			alert('need to login..');
			if(errback) errback();
		}
		else callback();
	};

	logInState(false);

	return siteInfo;
})(jQuery);