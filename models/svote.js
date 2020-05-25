const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VoteSchema = new Schema({
    position: { type: String, required: true },
    candidate: { type: String, required: true },
    dept: { type: String, required: true },
    hall: { type: String, required: true },
    voter_name: { type: String, required: true },
});

const Svote = mongoose.model('svote', VoteSchema);

module.exports = Svote;