const Analysis = require("../models/analysis");
const sendSMS = require("../utils/sendSMS");

function isSameDay(d1, d2) {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

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
            if (!item.date) continue;

            const dueDate = new Date(item.date);

            const fiveDaysBefore = new Date(dueDate);
            fiveDaysBefore.setDate(dueDate.getDate() - 5);

            const threeDaysBefore = new Date(dueDate);
            threeDaysBefore.setDate(dueDate.getDate() - 3);

            const customerData = {
                name: item.name,
                loan_no: item.loan_no,
                phone: item.phone,
                address: item.address || "",
                date: dueDate.toISOString().split("T")[0],
                employeeName: item.employeeName || "",
                pinCode: item.pinCode || "",
                status: item.status || "",
                message: item.message || "",
            };
            if (item.status === "paid") {
                noAction.push(customerData);
                continue;
            }

            let statusMessage = null;
            if (isSameDay(dueDate, today)) {
                const msg = `Today (${customerData.date}) is your due date. Kindly make payment.`;
                await sendSMS(item.phone, msg);
                statusMessage = "due today - message sent";
            } else if (isSameDay(fiveDaysBefore, today)) {
                const msg = `Reminder: Your due date is on ${customerData.date}. Please make payment within 5 days.`;
                await sendSMS(item.phone, msg);
                statusMessage = "5 days before - message sent";
            } else if (isSameDay(threeDaysBefore, today)) {
                const msg = `Reminder: Your due date ${customerData.date} is coming in 3 days. Kindly make payment.`;
                await sendSMS(item.phone, msg);
                statusMessage = "3 days before - message sent";
            }

            if (statusMessage) {
                customerData.statusMessage = statusMessage;
                action.push(customerData);
            }
        }

        return res.json({
            message: "SMS process finished",
            summaryCount: data.length,
            action,
            noAction,
        });
    } catch (error) {
        console.error("Messager Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
    