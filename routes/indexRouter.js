const express = require("express");
const router = express.Router();
const controller = require('../controllers/indexController');

router.get("/", controller.indexGet);

router.get("/delete", controller.fileDelete);

module.exports = router;