const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CandidateSchema = new Schema({
  name: { type: String, required: true },
  position: { type: String, required: true },
  votecount: {type: Number,default: 0},
});

const Candidate = mongoose.model("candidate", CandidateSchema);

module.exports = Candidate;
