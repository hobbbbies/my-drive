const express = require("express");
const router = express.Router();
const controller = require('../controllers/indexController');
const userAuth = require('../controllers/authMiddleware');

router.get("/", userAuth, controller.indexGet);

router.get("/delete", controller.fileDelete);

module.exports = router;