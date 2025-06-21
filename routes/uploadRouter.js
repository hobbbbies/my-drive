const express = require("express");
const router = express.Router();
const multer  = require('multer')
const controller = require("../controllers/uploadController");

// const storageOne = multer.diskStorage({
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname); // Get original file extension
//     const baseName = path.basename(file.originalname, ext);
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, `${baseName}-${uniqueSuffix}${ext}`);
//   }
// });

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", controller.uploadGet);

router.post("/", upload.single('file'), controller.uploadPost);

module.exports = router;