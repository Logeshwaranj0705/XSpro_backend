const mongoose = require("mongoose");

const NotesrSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref:"user", required:true},
    note: { type : String ,required:true},
    date :{ type: Date, default:Date.now, required:true},
}, {timestamps:true});

module.exports=mongoose.model("Notes",NotesrSchema);