const cron = require("node-cron");
const syncEmployeesToFirebase = require("../services/syncEmployeesToFirebase");

let lastRunDate = null; 

cron.schedule(
  "*/5 * * * *", 
  async () => {
    try {
      const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );

      const hours = now.getHours();
      const minutes = now.getMinutes();
      const today = now.toISOString().split("T")[0];

      if (hours === 11 && minutes < 5 && lastRunDate !== today) {
        console.log("⏳ Running 6AM employee sync...");

        await syncEmployeesToFirebase();

        lastRunDate = today;
        console.log("✅ Employee sync completed for", today);
      }
    } catch (err) {
      console.error("❌ Cron sync failed:", err);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

console.log("⏰ Employee sync cron armed for 6AM IST (FREE tier mode)");
