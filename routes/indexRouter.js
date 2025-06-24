const express = require("express");
const router = express.Router();
const controller = require('../controllers/indexController');
const userAuth = require('../controllers/authMiddleware');
const attachClient = require('../controllers/attachClient');

router.get("/", userAuth, attachClient, controller.indexGet);

router.get("/root/:folderid", userAuth, attachClient, controller.indexGet);

router.get("/delete", controller.fileDelete);

module.exports = router;