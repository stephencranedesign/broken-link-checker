var express = require('express');
var router = express.Router();
var SitesCtrl = require('../controllers/sites');

/*
    endpoints for getting at the info saved.
    dont see a need for authentication on these..
*/

router.get('/api/:user/sites/list', SitesCtrl.listEndPoint);
router.get('/api/:user/sites/find/:host', SitesCtrl.findEndPoint);
router.post('/api/:user/sites/:host/updateConfig', SitesCtrl.updateConfigEndPoint);


module.exports = router;