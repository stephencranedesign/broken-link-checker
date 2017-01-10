(function ($) {
	var username = $('#username');
	var password = $('#password');
	var login = $('#login');
	var signUp = $('#sign-up');

	signUp.on('click', function(e) {
		e.preventDefault();
		$.post('/api/signup', {name: username, password: password}, function(data) {
			console.log('yo', data);
		}, 'application/x-www-form-urlencoded');
	});
})(jQuery);