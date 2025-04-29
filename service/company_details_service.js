const CompanyDetails = require("../models/company_details");
const twilioClient = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Service to create new company details
// Service to create new company details
const createCompanyDetails = async (companyDetailsData) => {
  try {
    // Check if email already exists
    const existingEmail = await CompanyDetails.findOne({
      email: companyDetailsData.email,
    });
    if (existingEmail) {
      throw new Error("Email already exists");
    }

    // Check if companyTIN already exists
    const existingTIN = await CompanyDetails.findOne({
      companyTIN: companyDetailsData.companyTIN,
    });
    if (existingTIN) {
      throw new Error("Company TIN already exists");
    }

    // Create and save new company details
    const newCompanyDetails = new CompanyDetails(companyDetailsData);
    await newCompanyDetails.save();
    return newCompanyDetails;
  } catch (error) {
    throw new Error(error.message);
  }
};
// Service to get all company details
const getAllCompanyDetails = async () => {
  try {
    return await CompanyDetails.find();
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to get company details by phone number
const getCompanyDetailsByPhoneNumber = async (phoneNumber) => {
  try {
    return await CompanyDetails.findOne({ phoneNumber });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to get company details by email
const getCompanyDetailsByEmail = async (email) => {
  try {
    return await CompanyDetails.findOne({ email });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to get company details by VAT number
const getCompanyDetailsByVat = async (companyVat) => {
  try {
    return await CompanyDetails.findOne({ companyVat });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to update company details
const updateCompanyDetails = async (id, updateData) => {
  try {
    const updatedDetails = await CompanyDetails.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    if (!updatedDetails) {
      throw new Error("Company details not found");
    }
    return updatedDetails;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to delete company details
const deleteCompanyDetails = async (id) => {
  try {
    const deletedDetails = await CompanyDetails.findByIdAndDelete(id);
    if (!deletedDetails) {
      throw new Error("Company details not found");
    }
    return deletedDetails;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to generate and send OTP via SMS
const generateAndSendOTP = async (phoneNumber) => {
  try {
    // First check if the phone number exists in the database
    const companyDetails = await CompanyDetails.findOne({ phoneNumber });
    if (!companyDetails) {
      throw new Error("Phone number not found");
    }

    // Format the phone number for Twilio (assuming it needs + prefix)
    const formattedNumber = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber}`;

    // Send OTP via Twilio Verify
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID)
      .verifications.create({
        to: formattedNumber,
        channel: "sms",
      });

    return {
      success: true,
      message: "OTP sent successfully",
      verificationSid: verification.sid,
    };
  } catch (error) {
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};

// Service to verify OTP
const verifyOTP = async (phoneNumber, otpCode) => {
  try {
    // Format the phone number for Twilio
    const formattedNumber = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber}`;

    // Verify the OTP with Twilio
    const verificationCheck = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID)
      .verificationChecks.create({ to: formattedNumber, code: otpCode });

    if (verificationCheck.status === "approved") {
      // Update the contact verification status in the database
      await CompanyDetails.findOneAndUpdate(
        { phoneNumber },
        { isContactVerified: true }
      );
      return { success: true, message: "OTP verified successfully" };
    } else {
      throw new Error("Invalid OTP code");
    }
  } catch (error) {
    throw new Error(`OTP verification failed: ${error.message}`);
  }
};

const getCompanyDetailsByTin = async (companyTIN) => {
  try {
    return await CompanyDetails.findOne({ companyTIN });
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createCompanyDetails,
  getAllCompanyDetails,
  getCompanyDetailsByPhoneNumber,
  getCompanyDetailsByEmail,
  getCompanyDetailsByVat,
  updateCompanyDetails,
  deleteCompanyDetails,
  generateAndSendOTP,
  verifyOTP,
  getCompanyDetailsByTin,
};
