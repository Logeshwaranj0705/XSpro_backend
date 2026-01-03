const express = require("express");
const router = express.Router();
const { getAllUsersForAdmin } = require("../controllers/adminControllers");
const { protect } = require("../middleware/authMiddleware");

router.get("/users", protect, getAllUsersForAdmin);

module.exports = router;
