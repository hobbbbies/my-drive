const express = require("express");
const router = express.Router();
const controller = require("../controllers/folderController")
const userAuth = require('../controllers/authMiddleware');
const attachClient = require('../controllers/attachClient');

router.post("/create", userAuth, attachClient, controller.folderPost);

router.get("/create", userAuth, attachClient, controller.folderCreateGet);

// router.get("/:folderId", userAuth, controller.folderGet);

module.exports = router;