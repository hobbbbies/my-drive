const express = require("express");
const router = express.Router();
const multer  = require('multer')
const controller = require("../controllers/uploadController");
const userAuth = require("../controllers/authMiddleware");
const attachClient = require('../controllers/attachClient');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", userAuth, attachClient, controller.uploadGet);

router.post("/", userAuth, attachClient, upload.single('file'), controller.uploadPost);

module.exports = router;