const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PositionSchema = new Schema({
  name: { type: String, required: true },
});

const Position = mongoose.model("position", PositionSchema);

module.exports = Position;
