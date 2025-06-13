const mongoose = require("mongoose");

const personalDetailsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  streetAddress: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  isContactVerified: {
    type: Boolean,
    default: false, // By default, contact number is not verified
  },
});

module.exports = mongoose.model("PersonalDetails", personalDetailsSchema);
