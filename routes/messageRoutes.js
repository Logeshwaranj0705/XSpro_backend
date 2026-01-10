const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {messagerData, messageSend} = require("../controllers/messageControllers");


const router = express.Router();

router.get("/get",protect, messagerData);
router.post("/msgSend",protect, messageSend)

module.exports = router;
