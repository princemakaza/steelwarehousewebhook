const express = require("express");
const router = express.Router();
const companyDetailsService = require("../service/company_details_service");

// Route to create new company details and send OTP (simpler response)
router.post("/create", async (req, res) => {
  try {
    // Create company first
    const companyDetails = await companyDetailsService.createCompanyDetails(
      req.body
    );

    // Then send OTP
    const otpSent = await companyDetailsService.generateAndSendOTP(
      req.body.phoneNumber
    );

    res.status(201).json({
      success: true,
      message: "Company created and OTP sent",
      data: companyDetails,
    });
  } catch (error) {
    // Handle uniqueness errors
    if (
      error.message.includes("already exists") ||
      error.message === "Phone number not found"
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    res.status(400).json({
      success: false,
      message: "Error during creation",
      error: error.message,
    });
  }
});
// Route to create new company details and send OTP (with OTP response)
router.post("/create/return/otp", async (req, res) => {
  try {
    const companyDetails = await companyDetailsService.createCompanyDetails(
      req.body
    );
    const otpResponse = await companyDetailsService.generateAndSendOTP(
      req.body.phoneNumber
    );

    res.status(201).json({
      message: "Company created and OTP sent",
      data: {
        companyDetails,
        otpInfo: otpResponse,
      },
    });
  } catch (error) {
    // Handle uniqueness errors
    if (
      error.message.includes("already exists") ||
      error.message === "Phone number not found"
    ) {
      return res.status(409).json({
        message: error.message,
      });
    }
    res.status(400).json({
      message: "Creation failed",
      error: error.message,
    });
  }
});
// Route to get all company details (secured)
router.get("/getall", async (req, res) => {
  try {
    const allDetails = await companyDetailsService.getAllCompanyDetails();
    res.status(200).json({
      message: "Company details retrieved successfully",
      data: allDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving company details",
      error: error.message,
    });
  }
});

// Route to get company details by phone number (secured)
router.get("/getbyphone/:phoneNumber", async (req, res) => {
  try {
    const details = await companyDetailsService.getCompanyDetailsByPhoneNumber(
      req.params.phoneNumber
    );
    if (!details) {
      return res.status(404).json({ message: "Company details not found" });
    }
    res.status(200).json({
      message: "Company details retrieved successfully",
      data: details,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving company details",
      error: error.message,
    });
  }
});

// Route to get company details by email (secured)
router.get("/getbyemail/:email", async (req, res) => {
  try {
    const details = await companyDetailsService.getCompanyDetailsByEmail(
      req.params.email
    );
    if (!details) {
      return res.status(404).json({ message: "Company details not found" });
    }
    res.status(200).json({
      message: "Company details retrieved successfully",
      data: details,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving company details",
      error: error.message,
    });
  }
});

// Route to get company details by VAT number (secured)
router.get("/getbytin/:companyTIN", async (req, res) => {
  const { companyTIN } = req.params;
  try {
    const company = await companyDetailsService.getCompanyDetailsByTin(
      companyTIN
    );
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json({
      message: "Company details retrieved successfully",
      data: company,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/getbyvat/:companyVat", async (req, res) => {
  try {
    const details = await companyDetailsService.getCompanyDetailsByVat(
      req.params.companyVat
    );
    if (!details) {
      return res.status(404).json({ message: "Company details not found" });
    }
    res.status(200).json({
      message: "Company details retrieved successfully",
      data: details,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving company details",
      error: error.message,
    });
  }
});

// Route to update company details (secured)
router.put("/update/:id", async (req, res) => {
  try {
    const updatedDetails = await companyDetailsService.updateCompanyDetails(
      req.params.id,
      req.body
    );
    if (!updatedDetails) {
      return res.status(404).json({ message: "Company details not found" });
    }
    res.status(200).json({
      message: "Company details updated successfully",
      data: updatedDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating company details",
      error: error.message,
    });
  }
});

router.put("/updatebycompanytin/:companyTIN", async (req, res) => {
  try {
    const updatedDetails = await companyDetailsService.updateCompanyDetails(
      req.params.companyTIN,
      req.body
    );
    if (!updatedDetails) {
      return res.status(404).json({ message: "Company details not found" });
    }
    res.status(200).json({
      message: "Company details updated successfully",
      data: updatedDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating company details",
      error: error.message,
    });
  }
});

// Route to delete company details (secured)
router.delete("/delete/:id", async (req, res) => {
  try {
    await companyDetailsService.deleteCompanyDetails(req.params.id);
    res.status(200).json({
      message: "Company details deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting company details",
      error: error.message,
    });
  }
});

// Route to generate and send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const result = await companyDetailsService.generateAndSendOTP(phoneNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// 1. Route  – guarantee string before you even call the service
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone_number, otpCode } = req.body;

    // force both values to strings
    const result = await companyDetailsService.verifyOTP(
      String(phone_number),
      String(otpCode).trim() // "682025"
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Route to login with companyTIN and phoneNumber
router.post("/login", async (req, res) => {
  try {
    const { companyTIN, phoneNumber } = req.body;

    if (!companyTIN || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Both companyTIN and phoneNumber are required",
      });
    }

    const result = await companyDetailsService.loginCompany(
      String(companyTIN).trim(),
      String(phoneNumber).trim()
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
