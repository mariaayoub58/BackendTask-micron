var express = require("express");
var router = express.Router();

var user_controller = require("../controller/user");

//Fetch User details
router.get("/fetchUser", user_controller.fetchUser);

//Register new user
router.post("/registerUser", user_controller.registerUser);

//User signin
router.post("/signIn", user_controller.signIn);

//Update User details
router.put("/updateUser", user_controller.updateUser);

module.exports = router;
