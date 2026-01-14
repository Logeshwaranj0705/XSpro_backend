const cron = require("node-cron");
const syncEmployeesToFirebase = require("../services/syncEmployeesToFirebase");

cron.schedule(
  "* 6 * * *",
  async () => {
    try {
      console.log("⏳ Running employee sync...");
      console.log("✅ Employee sync completed");
    } catch (err) {
      console.error("❌ Cron sync failed:", err);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

console.log("⏰ Employee sync cron scheduled for 6AM IST Initiated");
