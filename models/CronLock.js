const mongoose = require("mongoose");

const cronLockSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  lastRunDate: String,
});

module.exports = mongoose.model("CronLock", cronLockSchema);
