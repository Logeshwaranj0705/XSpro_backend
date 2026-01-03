const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {messagerData} = require("../controllers/messageControllers");


const router = express.Router();

router.get("/get",protect, messagerData);

module.exports = router;