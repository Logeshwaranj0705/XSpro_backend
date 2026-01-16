const Analysis = require("../models/analysis");
const sendSMS = require("../utils/sendSMS");

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();
exports.messagerData = async (req, res) => {
  try {
    const queryUserId =
      req.user.role === "admin" && req.query.userId
        ? req.query.userId
        : req.user.id;

    const today = new Date();
    const data = await Analysis.find({ userId: queryUserId });

    const action = [];
    const noAction = [];

    for (const item of data) {
      if (!item.date || item.status === "paid") {
        noAction.push({ ...item._doc, reason: "Paid or No Date" });
        continue;
      }

      const dueDate = new Date(item.date);
      const fiveDaysBefore = new Date(dueDate);
      fiveDaysBefore.setDate(dueDate.getDate() - 5);

      const threeDaysBefore = new Date(dueDate);
      threeDaysBefore.setDate(dueDate.getDate() - 3);
      let statusMessage = "";

      if (isSameDay(dueDate, today)) {
        statusMessage = "due today - message sent";
      } else if (isSameDay(threeDaysBefore, today)) {
        statusMessage = "3 days before - message sent";
      } else if (isSameDay(fiveDaysBefore, today)) {
        statusMessage = "5 days before - message sent";
      }

      if (statusMessage) {
        action.push({ ...item._doc, statusMessage });
      }
    }

    return res.json({
      success: true,
      message: "Message history fetched",
      action,
      noAction,
    });
  } catch (error) {
    console.error("Messager Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.messageSend = async (req, res) => {
  try {
    const queryUserId =
      req.user.role === "admin" && req.query.userId
        ? req.query.userId
        : req.user.id;

    const today = new Date();
    const data = await Analysis.find({ userId: queryUserId });

    let sentCount = 0;

    for (const item of data) {
      if (!item.date || item.status === "paid") continue;

      const dueDate = new Date(item.date);
      const fiveDaysBefore = new Date(dueDate);
      fiveDaysBefore.setDate(dueDate.getDate() - 5);

      const threeDaysBefore = new Date(dueDate);
      threeDaysBefore.setDate(dueDate.getDate() - 3);

      let msg = "";
      let tId = "";

      if (isSameDay(dueDate, today)) {
        msg = `Dear Customer, your ${item.finance} loan account ${item.loan} has an overdue amount of Rs.${item.out_standing}. Kindly make the payment at the earliest. For queries, contact our support team.
        – Team ELSHADDAI ENTERPRISES`;
        tId = process.env.SMS_TEMPLATE_DUE;
      } else if (isSameDay(threeDaysBefore, today)) {
        msg = `Dear Customer, your ${item.finance} loan account ${item.loan} has an overdue amount of Rs.${item.out_standing}. Kindly make the payment at the earliest. For queries, contact our support team.
        – Team ELSHADDAI ENTERPRISES`;
        tId = process.env.SMS_TEMPLATE_DUE;
      } else if (isSameDay(fiveDaysBefore, today)) {
        msg = `Dear Customer, your ${item.finance} loan account ${item.loan} has an overdue amount of Rs.${item.out_standing}. Kindly make the payment at the earliest. For queries, contact our support team.
        – Team ELSHADDAI ENTERPRISES`;
        tId = process.env.SMS_TEMPLATE_DUE;
      }
      if (msg && tId) {
        await sendSMS(item.phone, msg, tId);
        sentCount++;
      }
    }

    return res.json({
      success: true,
      message: "SMS sent successfully",
      sentCount,
    });
  } catch (error) {
    console.error("Messager Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
