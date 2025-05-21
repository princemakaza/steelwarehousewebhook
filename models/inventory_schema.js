const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  itemNo: {
    type: Number,
    required: false,
  },
  itemDescription: {
    type: String,
    required: false,
  },
  inStock: {
    type: String,
    required: false,
  },
  itemGroup: {
    type: String,
    required: false,
  },
  inventoryUoM: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("Inventory", inventorySchema);