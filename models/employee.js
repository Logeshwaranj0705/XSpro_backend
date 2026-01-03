const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: Number, required: true },
  pinCodes: { type: [String], required: true },
  work: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model("Employee", employeeSchema);