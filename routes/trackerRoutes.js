const express = require("express");
const router = express.Router();
const { getAllWorkers, getAssignments } = require("../services/firebaseService");

router.get("/workers", async (req, res) => {
  try {
    const workers = await getAllWorkers();
    res.json(workers);
  } catch (err) {
    console.error("❌ Failed to fetch workers:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/assignments/:workerId", async (req, res) => {
  try {
    const assignments = await getAssignments(req.params.workerId);
    res.json(assignments);
  } catch (err) {
    console.error("❌ Failed to fetch assignments:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
