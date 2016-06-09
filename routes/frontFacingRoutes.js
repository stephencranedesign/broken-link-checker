// var express = require('express');
// var router = express.Router();
// var auth = require('../custom-modules/authentication.js');

// router.get('/', auth.isAuthenticated, function(req, res) {
// 	console.log('post: ', req.body.username, req.body.password);
//     Users.set(req.body.username, req.body.password, function(user) {
//         console.log('user: ', user);
//         res.json(user);
//     }, function(err) {
//         res.status(400).json(err);
//     });
// });

// module.exports = router;