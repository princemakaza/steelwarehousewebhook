const BusinessPartner = require("../models/business_partners_schema");
const fs = require("fs");
const path = require("path");

// Service to create a single business partner
const createBusinessPartner = async (bpData) => {
  try {
    const newBP = new BusinessPartner(bpData);
    await newBP.save();
    return newBP;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to create multiple business partners from JSON file
const createManyBusinessPartners = async () => {
  try {
    const filePath = path.join(__dirname, "business_list.json");
    const jsonData = fs.readFileSync(filePath, "utf8");
    const bpArray = JSON.parse(jsonData);

    const transformedBPs = bpArray.map((bp) => ({
      bpCode: bp["BP Code"],
      bpName: bp["BP Name"],
      bpCurrency: bp["BP Currency"],
    }));

    const createdBPs = await BusinessPartner.insertMany(transformedBPs);
    return createdBPs;
  } catch (error) {
    throw new Error(`Failed to create business partners: ${error.message}`);
  }
};

// Service to get all business partners
const getAllBusinessPartners = async () => {
  try {
    return await BusinessPartner.find();
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to get a business partner by bpCode
const getBusinessPartnerByCode = async (bpCode) => {
  try {
    return await BusinessPartner.findOne({ bpCode });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to update a business partner by bpCode
const updateBusinessPartner = async (bpCode, updateData) => {
  try {
    const updatedBP = await BusinessPartner.findOneAndUpdate(
      { bpCode },
      updateData,
      { new: true }
    );
    if (!updatedBP) {
      throw new Error("Business partner not found");
    }
    return updatedBP;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to delete a business partner by bpCode
const deleteBusinessPartner = async (bpCode) => {
  try {
    const deletedBP = await BusinessPartner.findOneAndDelete({ bpCode });
    if (!deletedBP) {
      throw new Error("Business partner not found");
    }
    return deletedBP;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createBusinessPartner,
  createManyBusinessPartners,
  getAllBusinessPartners,
  getBusinessPartnerByCode,
  updateBusinessPartner,
  deleteBusinessPartner,
};
