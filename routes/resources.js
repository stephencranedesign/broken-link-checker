var express = require('express');
var router = express.Router();

var ResourcesCtrl = require('../controllers/resources');

router.get('/api/:user/resources/:host/list', ResourcesCtrl.list);
router.get("/api/:user/resources/:host/brokenLinks", ResourcesCtrl.getBrokenLinks);
router.get("/api/:user/resources/:host/brokenLinks/:from/:to", ResourcesCtrl.getBrokenLinks);
router.get("/api/:user/resources/:host/getWhitelist", ResourcesCtrl.getWhiteList);

// AUTH.secure("/api/:user/resources/whitelist");
router.post("/api/:user/resources/whitelist", ResourcesCtrl.whiteList);
router.post("/api/:user/resources/remove", ResourcesCtrl.remove);

module.exports = router;