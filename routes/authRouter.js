const express = require("express");
const router = express.Router();
const loginController = require("../controllers/loginController");
const signupController = require("../controllers/signupController");
const passwordController = require("../controllers/passwordController");
const { log } = require("console");

router.get("/login", loginController.logout, (req, res) => {
    res.render('loginView');
});
router.post("/login", loginController.loginPost);
router.post("/demo-login", loginController.demoLogin);

router.get("/signup", (req, res) => {
    res.render('signupView');
});

router.post("/signup", signupController.signup);

// Forgot password routes
router.get("/forgot-password", passwordController.forgotPasswordGet);
router.post("/forgot-password", passwordController.forgotPasswordPost);

// Reset password routes
router.get("/reset-password", passwordController.resetPasswordGet);
router.post("/reset-password", passwordController.resetPasswordPost);

// router.get("/logout", loginController.logout, (req, res) => {
//     res.redirect("/loginView");
// });

module.exports = router;