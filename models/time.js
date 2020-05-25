const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TimeSchema = new Schema({
    name1: { type: Date, required: true },
    name2: { type: Date, required: true },
    name3: { type: Date, required: true },
    name4: { type: Date, required: true },
});

const Time = mongoose.model("time", TimeSchema);

module.exports = Time;