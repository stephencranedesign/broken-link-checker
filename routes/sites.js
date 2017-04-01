var express = require('express');
var router = express.Router();
var SitesCtrl = require('../controllers/sites');

/*
    endpoints for getting at the info saved.
    dont see a need for authentication on these..
*/

router.get('/api/:user/sites/list', SitesCtrl.listEndPoint);

router.get('/api/:user/sites/find/:host', SitesCtrl.findEndPoint);

router.get('/api/:user/sites/findBrokenLinks/:host', SitesCtrl.findBrokenLinksEndPoint);


module.exports = router;