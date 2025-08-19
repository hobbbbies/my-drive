const express = require("express");
const router = express.Router();
const controller = require("../controllers/folderController")
const userAuth = require('../middleware/authMiddleware');
const attachClient = require('../middleware/attachClient');

router.post("/create", userAuth, attachClient, controller.folderPost);

router.get("/create", userAuth, attachClient, controller.folderCreateGet);

router.get("/delete", userAuth, attachClient, controller.folderDelete);

router.post("/share", userAuth, attachClient, controller.shareFolderController);

module.exports = router;