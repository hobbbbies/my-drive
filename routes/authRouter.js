const express = require("express");
const router = express.Router();
const loginController = require("../controllers/loginController");
const signupController = require("../controllers/signupController");

router.get("/login", (req, res) => {
    res.render('loginView');
});
router.post("/login", loginController.loginPost);

router.get("/signup", (req, res) => {
    res.render('signupView');
});
router.post("/signup", signupController.signup);

router.get("/logout", loginController.logout);

module.exports = router;