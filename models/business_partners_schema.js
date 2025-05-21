const mongoose = require("mongoose");

const businessPartnerSchema = new mongoose.Schema({
  bpCode: {
    type: String,
    required: false,
  },
  bpName: {
    type: String,
    required: false,
  },
  bpCurrency: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("BusinessPartners", businessPartnerSchema);
