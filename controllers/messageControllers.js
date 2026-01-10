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

      let msg = "";
      let tId = "";
      let statusMessage = "";

      if (isSameDay(dueDate, today)) {
        msg = `Dear Customer, your loan account ${item.loan_no} has a payment of Rs.${item.out_standing} due today.
Please refer to your loan schedule for payment details.
For queries, contact 9363318486.
– Team ELSHADDAI ENTERPRISES`;
        tId = process.env.SMS_TEMPLATE_DUE_TODAY;
        statusMessage = "due today - message sent";
      } else if (isSameDay(threeDaysBefore, today)) {
        msg = `Dear Customer, your loan account ${item.loan_no} has a payment of Rs.${item.out_standing} due in 3 days.
This message is sent as per your loan schedule.
For queries, contact 9363318486.
– Team ELSHADDAI ENTERPRISES`;
        tId = process.env.SMS_TEMPLATE_DUE_3_DAYS;
        statusMessage = "3 days before - message sent";
      } else if (isSameDay(fiveDaysBefore, today)) {
        msg = `Dear Customer, your loan account ${item.loan_no} has a payment of Rs.${item.out_standing} due in 5 days.
Please plan your payment as per the due date.
For queries, contact 9363318486.
– Team ELSHADDAI ENTERPRISES`;
        tId = process.env.SMS_TEMPLATE_DUE_5_DAYS;
        statusMessage = "5 days before - message sent";
      }

      if (msg && tId) {
        await sendSMS(item.phone, msg, tId);
        action.push({ ...item._doc, statusMessage });
      } else {
        noAction.push({ ...item._doc, reason: "Date mismatch" });
      }
    }

    return res.json({
      success: true,
      message: "SMS process finished",
      summary: {
        total_processed: data.length,
        messages_sent: action.length,
        skipped: noAction.length,
      },
      action,
      noAction,
    });
  } catch (error) {
    console.error("Messager Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
