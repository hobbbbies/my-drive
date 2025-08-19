const express = require("express");
const router = express.Router();
const controller = require('../controllers/indexController');
const userAuth = require('../middleware/authMiddleware');
const attachClient = require('../middleware/attachClient');

router.get("/", userAuth, attachClient, controller.indexGet);

router.get("/root/:folderid", userAuth, attachClient, controller.indexGet);
module.exports = router;