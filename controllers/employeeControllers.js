const mongoose = require("mongoose");
const Employee = require("../models/employee");
function getTargetUserId(req) {
    const selectedUserId = req.query.userId;
    if (selectedUserId && req.user.role === "admin") return selectedUserId;
    return req.user.id;
}
exports.addEmployee = async (req, res) => {
  try {
    const userId = getTargetUserId(req);
    const rows = req.body.data;

    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const bulkOps = [];

    for (let i = 0; i < rows.length; i++) {
      const { name, phone, address, pinCodes } = rows[i];
      if (!name || !phone || !address || !pinCodes) {
        return res.status(400).json({ message: `Missing data at row ${i + 1}` });
      }

      const pincodesArray = Array.isArray(pinCodes)
        ? pinCodes.map(p => String(p).trim())
        : pinCodes.toString().split(",").map(p => p.trim());

      bulkOps.push({
        updateOne: {
          filter: { userId, name: name.trim(), phone },
          update: {
            $set: {
              userId,
              name: name.trim(),
              phone,
              address: address.trim(),
              pinCodes: pincodesArray
            }
          },
          upsert: true
        }
      });
    }

    const result = await Employee.bulkWrite(bulkOps);

    res.status(200).json({
      message: "Employees processed successfully",
      inserted: result.upsertedCount,
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const userId = getTargetUserId(req);

    const result = await Employee.deleteMany({ userId });

    res.json({
      message: "Analysis data deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};
