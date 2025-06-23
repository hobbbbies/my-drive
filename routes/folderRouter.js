const express = require("express");
const router = express.Router();
const controller = require("../controllers/folderController")
const userAuth = require('../controllers/authMiddleware');

router.post("/create", userAuth, controller.folderPost);

router.get("/create", userAuth, controller.folderCreateGet);

router.get("/:folderId", controller.folderGet);

module.exports = router;