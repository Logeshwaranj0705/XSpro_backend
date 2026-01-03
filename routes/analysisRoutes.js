const express = require("express");
const {
    addData,
    getData,
    deleteData,
    downloadDataExcel,
    getEmployeeUsageCount,
    addUserNote
} = require("../controllers/analysisControllers");
const {protect}=require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add",protect,addData);
router.get("/get",protect,getData);
router.get("/downloadexcel",protect,downloadDataExcel);
router.delete("/delete-all",protect,deleteData);
router.get("/empcount",protect,getEmployeeUsageCount);
router.post("/addnote",protect,addUserNote);

module.exports = router;