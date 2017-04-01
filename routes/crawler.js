var express = require("express");
var router = express.Router();
var AUTH = require('../custom-modules/authentication');
var crawlerCtrl = require('../controllers/crawler');

router.get("/api/:user/crawler/:host/status", crawlerCtrl.statusForUserSite);

/* main endpoint to hit for setting up a site to crawl. */
AUTH.secure("/api/:user/crawler/:host/register");
router.post("/api/:user/crawler/:host/register", crawlerCtrl.registerEndPoint);

AUTH.secure("/api/:user/crawler/:host/unRegister");
router.post("/api/:user/crawler/:host/unRegister", crawlerCtrl.unRegisterEndPoint);

router.get("/api/crawler/status", crawlerCtrl.status);

crawlerCtrl.syncDbSitesWithNode();

module.exports = router;

