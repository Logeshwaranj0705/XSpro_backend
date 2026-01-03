const Analysis = require("../models/analysis");
const Employee = require("../models/employee");
const Notes = require("../models/notes");
const mongoose = require("mongoose");


function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}


exports.getDashboardData = async (req, res) => {
  try {
    const requestedUserId = req.query.userId || req.user._id.toString();

    if (
      requestedUserId !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Forbidden: Admin only" });
    }


    const analysis = await Analysis.find({
      userId: requestedUserId
    }).sort({ date: 1 });

    const employee = await Employee.find({
      userId: requestedUserId
    }).sort({ createdAt: 1 });

    const notes = await Notes.find({
      userId: requestedUserId
    }).sort({ createdAt: -1 });


    const employeeUsage = await Analysis.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(requestedUserId),
          employeeName: { $ne: null } 
        }
      },
      {
        $lookup: {
          from: "employees",
          let: {
            empName: "$employeeName",
            userId: new mongoose.Types.ObjectId(requestedUserId)
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$name", "$$empName"] },
                    { $eq: ["$userId", "$$userId"] }
                  ]
                }
              }
            }
          ],
          as: "empDetails"
        }
      },
      { $unwind: "$empDetails" },
      {
        $group: {
          _id: {
            name: "$employeeName",
            phone: "$empDetails.phone"
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          employeeName: "$_id.name",
          employeePhone: "$_id.phone",
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const action = [];
    const noAction = [];

    for (const item of analysis) {
      if (!item.date) continue;

      const dueDate = new Date(item.date);
      const fiveDaysBefore = new Date(dueDate);
      fiveDaysBefore.setDate(dueDate.getDate() - 5);

      const threeDaysBefore = new Date(dueDate);
      threeDaysBefore.setDate(dueDate.getDate() - 3);

      const customerData = {
        _id: item._id,
        name: item.name,
        loan_no: item.loan_no,
        phone: item.phone,
        address: item.address || "",
        date: dueDate.toISOString().split("T")[0],
        employeeName: item.employeeName || "",
        pinCode: item.pinCode || "",
        status: item.status || "",
        message: item.message || ""
      };

      if (item.status === "paid") {
        noAction.push(customerData);
        continue;
      }

      let statusMessage = null;

      if (isSameDay(dueDate, today))
        statusMessage = "due today - message sent";
      else if (isSameDay(fiveDaysBefore, today))
        statusMessage = "5 days before - message sent";
      else if (isSameDay(threeDaysBefore, today))
        statusMessage = "3 days before - message sent";

      if (statusMessage) {
        customerData.statusMessage = statusMessage;
        action.push(customerData);
      }
    }


    res.json({
      success: true,
      analysis,
      employee,
      employeeUsage, 
      action,
      noAction,
      notes
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({
      message: "Dashboard load failed",
      error: err.message
    });
  }
};

exports.deleteDashboardNote = async (req, res) => {
  try {
    const requestedUserId = req.query.userId || req.user._id.toString();
    const noteId = req.params.id;

    if (
      requestedUserId !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const deleted = await Notes.findOneAndDelete({
      _id: noteId,
      userId: requestedUserId
    });

    if (!deleted) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({
      success: true,
      message: "Note deleted successfully"
    });
  } catch (err) {
    console.error("Delete dashboard note error:", err);
    res.status(500).json({
      message: "Failed to delete note",
      error: err.message
    });
  }
};

