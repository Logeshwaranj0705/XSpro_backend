const express = require("express");

const {
    addEmployee,
    getEmployee,
    deleteEmployee
} = require("../controllers/employeeControllers");

const {protect} =require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add",protect,addEmployee);
router.delete("/delete-all",protect,deleteEmployee);

module.exports = router;