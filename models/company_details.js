const mongoose = require("mongoose");

const companyDetailsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  companyVat: {
    type: String,
    required: true,
  },
  companyTIN: {
    type: String,
    required: true,
  },
  companyAddress: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  contactPerson: {
    type: String,
    required: true,
  },
  isContactVerified: {
    type: Boolean,
    default: false, // By default, contact number is not verified
  },
});

module.exports = mongoose.model("CompanyDetails", companyDetailsSchema);
