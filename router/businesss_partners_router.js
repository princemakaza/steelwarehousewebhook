const express = require("express");
const router = express.Router();
const businessPartnerService = require("../service/business_partners_service");

// Route to create a single business partner
router.post("/create_one", async (req, res) => {
  try {
    const newBP = await businessPartnerService.createBusinessPartner(req.body);
    res.status(201).json({
      success: true,
      message: "Business partner created successfully",
      data: newBP
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating business partner",
      error: error.message
    });
  }
});

// Route to import multiple business partners from JSON file
router.post("/import", async (req, res) => {
  try {
    const createdBPs = await businessPartnerService.createManyBusinessPartners();
    res.status(201).json({
      success: true,
      message: "Business partners imported successfully",
      data: createdBPs,
      count: createdBPs.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error importing business partners",
      error: error.message
    });
  }
});

// Route to get all business partners
router.get("/get_all", async (req, res) => {
  try {
    const allBPs = await businessPartnerService.getAllBusinessPartners();
    res.status(200).json({
      success: true,
      message: "Business partners retrieved successfully",
      data: allBPs,
      count: allBPs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving business partners",
      error: error.message
    });
  }
});

// Route to get business partner by bpCode
router.get("/:bpCode", async (req, res) => {
  try {
    const bp = await businessPartnerService.getBusinessPartnerByCode(req.params.bpCode);
    if (!bp) {
      return res.status(404).json({
        success: false,
        message: "Business partner not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Business partner retrieved successfully",
      data: bp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving business partner",
      error: error.message
    });
  }
});

// Route to update business partner by bpCode
router.put("/:bpCode", async (req, res) => {
  try {
    const updatedBP = await businessPartnerService.updateBusinessPartner(req.params.bpCode, req.body);
    res.status(200).json({
      success: true,
      message: "Business partner updated successfully",
      data: updatedBP
    });
  } catch (error) {
    const status = error.message === "Business partner not found" ? 404 : 400;
    res.status(status).json({
      success: false,
      message: "Error updating business partner",
      error: error.message
    });
  }
});

// Route to delete business partner by bpCode
router.delete("/:bpCode", async (req, res) => {
  try {
    const deletedBP = await businessPartnerService.deleteBusinessPartner(req.params.bpCode);
    res.status(200).json({
      success: true,
      message: "Business partner deleted successfully",
      data: deletedBP
    });
  } catch (error) {
    const status = error.message === "Business partner not found" ? 404 : 500;
    res.status(status).json({
      success: false,
      message: "Error deleting business partner",
      error: error.message
    });
  }
});

module.exports = router;
