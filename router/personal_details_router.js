const express = require("express");
const router = express.Router();
const personalDetailsService = require("../service/personal_details_service");

// Route to create new personal details
// Route to create new personal details and send OTP (simpler response)
router.post("/create", async (req, res) => {
  try {
    // First create the personal details
    const personalDetails = await personalDetailsService.createPersonalDetails(
      req.body
    );

    await personalDetailsService.generateAndSendOTP(req.body.contactNumber);

    res.status(201).json({
      success: true,
      message:
        "Personal details created successfully and OTP has been sent to your number",
      data: personalDetails,
    });
  } catch (error) {
    if (error.message === "Email already exists") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    res.status(400).json({
      success: false,
      message: "Error creating personal details",
      error: error.message,
    });
  }
});

// Route to create new personal details and send OTP
router.post("/create/return/otp", async (req, res) => {
  try {
    // First create the personal details
    const personalDetails = await personalDetailsService.createPersonalDetails(
      req.body
    );

    // Then send OTP to the provided contact number
    const otpResponse = await personalDetailsService.generateAndSendOTP(
      req.body.contactNumber
    );

    res.status(201).json({
      message:
        "Personal details created successfully and OTP has been sent to your number",
      data: {
        personalDetails,
        otpInfo: {
          status: otpResponse.success,
          message: otpResponse.message,
        },
      },
    });
  } catch (error) {
    if (error.message === "Email already exists") {
      return res.status(409).json({ message: error.message });
    }
    res.status(400).json({
      message: "Error creating personal details",
      error: error.message,
    });
  }
});

// Route to get all personal details (secured)
router.get("/getall", async (req, res) => {
  try {
    const allDetails = await personalDetailsService.getAllPersonalDetails();
    res.status(200).json({
      message: "Personal details retrieved successfully",
      data: allDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving personal details",
      error: error.message,
    });
  }
});

// Route to get personal details by contact number (secured)
router.get("/getbycontact/:contactNumber", async (req, res) => {
  try {
    const details =
      await personalDetailsService.getPersonalDetailsByContactNumber(
        req.params.contactNumber
      );
    if (!details) {
      return res.status(404).json({ message: "Personal details not found" });
    }
    res.status(200).json({
      message: "Personal details retrieved successfully",
      data: details,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving personal details",
      error: error.message,
    });
  }
});

// Route to get personal details by email (secured)
router.get("/getbyemail/:email", async (req, res) => {
  try {
    const details = await personalDetailsService.getPersonalDetailsByEmail(
      req.params.email
    );
    if (!details) {
      return res.status(404).json({ message: "Personal details not found" });
    }
    res.status(200).json({
      message: "Personal details retrieved successfully",
      data: details,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving personal details",
      error: error.message,
    });
  }
});

// Route to update personal details (secured)
router.put("/update/:id", async (req, res) => {
  try {
    const updatedDetails = await personalDetailsService.updatePersonalDetails(
      req.params.id,
      req.body
    );
    if (!updatedDetails) {
      return res.status(404).json({ message: "Personal details not found" });
    }
    res.status(200).json({
      message: "Personal details updated successfully",
      data: updatedDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating personal details",
      error: error.message,
    });
  }
});

// Route to delete personal details (secured)
router.delete("/delete/:id", async (req, res) => {
  try {
    await personalDetailsService.deletePersonalDetails(req.params.id);
    res.status(200).json({
      message: "Personal details deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting personal details",
      error: error.message,
    });
  }
});

// Route to generate and send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { contactNumber } = req.body;
    const result = await personalDetailsService.generateAndSendOTP(
      contactNumber
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Route to verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { contactNumber, otpCode } = req.body;
    const result = await personalDetailsService.verifyOTP(
      contactNumber,
      otpCode
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
