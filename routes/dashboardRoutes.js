const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getDashboardData,
  deleteDashboardNote
} = require("../controllers/getDashBoardData");

const router = express.Router();

router.get("/get", protect, getDashboardData);
router.delete("/note/:id", protect, deleteDashboardNote);

module.exports = router;
