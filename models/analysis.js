const mongoose = require("mongoose");

const AnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  loan_no: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: Number, required: true },
  status: { type: String, required: true },
  date: { type: Date, default: Date.now },
  out_standing: String,
  make: String,
  reg_no: String,
  contact_person: String,
  contact_person_cnt_number: { type: Number },
  employeeName: String,
  pinCode: { type: String, required: true },
  message: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Analysis", AnalysisSchema);