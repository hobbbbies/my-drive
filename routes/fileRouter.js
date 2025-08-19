const express = require("express");
const router = express.Router();
const multer  = require('multer')
const controller = require("../controllers/fileController");
const userAuth = require("../middleware/authMiddleware");
const attachClient = require('../middleware/attachClient');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", userAuth, attachClient, controller.fileGet);

router.post("/", userAuth, attachClient, upload.single('file'), controller.filePost);

router.post("/share", userAuth, attachClient, controller.fileShare);

module.exports = router;