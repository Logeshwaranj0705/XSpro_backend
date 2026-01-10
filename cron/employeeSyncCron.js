const cron = require("node-cron");
const syncEmployeesToFirebase = require("../services/syncEmployeesToFirebase");
const CronLock = require("../models/CronLock");

cron.schedule(
  "*/5 * * * *", // every 5 minutes
  async () => {
    try {
      const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );

      const hours = now.getHours();
      const minutes = now.getMinutes();
      const today = now.toISOString().split("T")[0];

      // ✅ Wider window: 11:00 – 11:30 IST
      if (hours === 14 && minutes <= 30) {
        const lock =
          (await CronLock.findOne({ name: "employee-sync" })) ||
          new CronLock({ name: "employee-sync" });

        if (lock.lastRunDate === today) {
          return; // already ran today
        }

        console.log("⏳ Running employee sync (FREE tier safe mode)");

        await syncEmployeesToFirebase();

        lock.lastRunDate = today;
        await lock.save();

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

console.log("⏰ Employee sync armed for IST (FREE tier, restart-safe)");
