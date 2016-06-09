var express = require('express');
var router = express.Router();
var Users = require('../services/users.js');

router.post('/api/users/create', function(req, res) {
	console.log('post: ', req.body.username, req.body.password);
    Users.set(req.body.username, req.body.password, function(user) {
        console.log('user: ', user);
        res.json(user);
    }, function(err) {
        res.status(400).json(err);
    });
});

router.get('/api/users/list', function(req, res) {
	Users.list(function(users) {
		res.json(users);
	}, function() {
		res.status(400).json(err);
	});
});

module.exports = router;