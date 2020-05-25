const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true},
    dept: {type: String, required: true},
    hall: {type: String, required: true},
    password: {type: String, required: true},
    resetPasswordToken: {type: String},
    resetPasswordExpires: {type: Date},
    isapplicant: {type: Boolean,default: false},
    islogin: {type: Boolean, default: false},
});

const Voter = mongoose.model('voter',UserSchema);

module.exports = Voter;