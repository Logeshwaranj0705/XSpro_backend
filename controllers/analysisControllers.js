const xlsx = require("xlsx");
const firestore = require("../config/firebase");
const Analysis = require("../models/analysis");
const Employee = require("../models/employee");
const Notes = require("../models/notes");
const mongoose = require("mongoose");

const delay = ms => new Promise(res => setTimeout(res, ms));

function makeWorkerId(name) {
  if (!name || typeof name !== "string") return null;

  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}


function formatDate(d) {
  if (!d) return new Date();

  if (d instanceof Date) return d;

  if (typeof d === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + d * 86400000);
  }

  const parts = d.toString().split("-");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(`${year}-${month}-${day}`);
  }

  return new Date(d);
}

function getTargetUserId(req) {
  const selectedUserId = req.query.userId;
  if (selectedUserId && req.user.role === "admin") return selectedUserId;
  return req.user.id;
}


exports.addData = async (req, res) => {
  try {
    const userId = getTargetUserId(req);
    const rows = req.body.data;

    if (!Array.isArray(rows)) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const bulkOps = [];
    const resetEmployees = new Set();

    for (let i = 0; i < rows.length; i++) {
      const {
        loan_no,
        name,
        phone,
        address,
        date,
        status,
        pinCode,
        out_standing,
        make,
        reg_no,
        contact_person,
        contact_person_cnt_number,
        finance,
      } = rows[i];

      if (!name || !loan_no || !phone || !address || !status || !pinCode) {
        return res
          .status(400)
          .json({ message: `Missing data at row ${i + 1}` });
      }

      const employee = await Employee.findOne({
        userId,
        pinCodes: { $in: [String(pinCode)] }
      });

      if (!employee) continue;

      const employeeName = employee.name;
      const message = status === "due" ? "required" : "not required";

      if (!resetEmployees.has(employee._id.toString())) {
        await Employee.updateOne(
          { _id: employee._id },
          { $set: { work: [] } }
        );
        resetEmployees.add(employee._id.toString());
      }

      if (status === "due") {
        const workEntry = `${name.trim()} - ${loan_no}`;
        await Employee.updateOne(
          { _id: employee._id },
          { $addToSet: { work: workEntry } }
        );
      }

      bulkOps.push({
        updateOne: {
          filter: { userId, name: name.trim(), phone },
          update: {
            $set: {
              status,
              date: formatDate(date),
              employeeName,
              address: address.trim(),
              out_standing,
              contact_person,
              contact_person_cnt_number,
              message
            },
            $setOnInsert: {
              loan_no,
              userId,
              name: name.trim(),
              phone,
              make,
              reg_no,
              pinCode,
              finance
            }
          },
          upsert: true
        }
      });
    }

    const result = await Analysis.bulkWrite(bulkOps);

    res.json({
      message: "Data processed successfully",
      inserted: result.upsertedCount,
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


exports.getData = async (req, res) => {
  try {
    const userId = getTargetUserId(req);

    const analysis = await Analysis.find({ userId }).sort({ date: 1 });
    const employee = await Employee.find({ userId }).sort({ createdAt: 1 });

    res.json({ analysis, employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


exports.deleteData = async (req, res) => {
  try {
    const userId = getTargetUserId(req);

    const result = await Analysis.deleteMany({ userId });

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



exports.downloadDataExcel = async (req, res) => {
  try {
    const userId = getTargetUserId(req);
    const analysis = await Analysis.find({
      userId,
      employeeName: { $ne: null }
    }).sort({ date: 1 });

    const data = analysis.map(item => ({
      Loan_no: item.loan_no,
      Name: item.name,
      Address: item.address,
      Phone: item.phone,
      Out_standing: item.out_standing,
      Reg_no: item.reg_no,
      Make: item.make,
      Date: item.date ? item.date.toISOString().split("T")[0] : "",
      Status: item.status,
      Pincode: item.pinCode,
      Contact_person: item.contact_person,
      Contact_person_cnt_number: item.contact_person_cnt_number,
      Executive: item.employeeName,
      Finance: item.finance
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Analysis");

    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=analysis_details.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


exports.getEmployeeUsageCount = async (req, res) => {
  try {
    const userId = getTargetUserId(req);

    const data = await Analysis.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          employeeName: { $ne: null }
        }
      },
      {
        $lookup: {
          from: "employees",
          let: {
            empName: "$employeeName",
            userId: new mongoose.Types.ObjectId(userId)
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

    res.json(data);
  } catch (error) {
    console.error("Aggregation error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


exports.addUserNote = async (req, res) => {
  try {
    const userId = getTargetUserId(req);
    const { note } = req.body;

    if (!note || typeof note !== "string") {
      return res.status(400).json({ message: "No valid note provided" });
    }

    const savedNote = await Notes.create({
      userId,
      note,
      date: new Date()
    });

    res.status(201).json({
      message: "Note saved successfully",
      savedNote
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to save note",
      error: err.message
    });
  }
};

exports.syncEmployeesToFirebase = async (req, res) => {
  try {
    const userId = getTargetUserId(req);

    console.log("🔄 Firebase sync started | user:", userId);

    const employees = await Employee.find({ userId });

    const currentWorkerIds = employees
      .map(emp => makeWorkerId(emp.name))
      .filter(Boolean);

    const workersSnapshot = await firestore
      .collection("workers")
      .where("userId", "==", userId)
      .get();

    for (const doc of workersSnapshot.docs) {
      if (!currentWorkerIds.includes(doc.id)) {
        await firestore.collection("workers").doc(doc.id).delete();
        await firestore.collection("assignments").doc(doc.id).delete();
        console.log(`🗑 Deleted worker: ${doc.id}`);
      }
    }

    for (const emp of employees) {
      const workerId = makeWorkerId(emp.name);
      if (!workerId) continue;

      await firestore.collection("workers").doc(workerId).set(
        {
          name: emp.name,
          phone: emp.phone || "",
          password: "elshaddai_09",
          updatedAt: new Date()
        },
        { merge: true }
      );

      const points = [];
      let index = 1;

      for (const item of emp.work || []) {
        if (!item.includes(" - ")) continue;

        const [customerName, loan_no] = item.split(" - ");

        points.push({
          id: "p" + index,
          name: customerName.trim(),
          loan_no: loan_no?.trim(),
          lat: "",
          lng: "",
          visited: false
        });

        index++;
        await delay(300);
      }

      await firestore.collection("assignments").doc(workerId).set(
        {
          points,
          status: "pending",
          assignedAt: new Date()
        },
        { merge: true }
      );

      console.log(`✅ Synced: ${emp.name} | points: ${points.length}`);
    }

    res.json({
      message: "Firebase sync completed successfully",
      employeesSynced: employees.length
    });
  } catch (error) {
    console.error("🔥 Firebase sync error:", error);
    res.status(500).json({
      message: "Firebase sync failed",
      error: error.message
    });
  }
};
