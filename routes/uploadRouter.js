const express = require("express");
const router = express.Router();
const multer  = require('multer')
const controller = require("../controllers/uploadController");
const userAuth = require("../controllers/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", userAuth, controller.uploadGet);

router.post("/", upload.single('file'), controller.uploadPost);

module.exports = router;