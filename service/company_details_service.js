const CompanyDetails = require("../models/company_details");
const twilioClient = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Service to create new company details
// Service to create new company details
const createCompanyDetails = async (companyDetailsData) => {
  try {
    // Check for existing email
    const existingEmail = await CompanyDetails.findOne({
      email: companyDetailsData.email,
    });
    if (existingEmail) throw new Error("Email already exists");

    // Check for existing TIN
    const existingTIN = await CompanyDetails.findOne({
      companyTIN: companyDetailsData.companyTIN,
    });
    if (existingTIN) throw new Error("Company TIN already exists");

    // Check for existing phone number
    const existingPhone = await CompanyDetails.findOne({
      phoneNumber: companyDetailsData.phoneNumber,
    });
    if (existingPhone) throw new Error("Phone number already exists");

    // Create new entry
    const newCompanyDetails = new CompanyDetails(companyDetailsData);
    await newCompanyDetails.save();
    return newCompanyDetails;
  } catch (error) {
    // Handle duplicate key error (fallback)
    if (error.code === 11000) {
      const key = Object.keys(error.keyPattern)[0];
      throw new Error(`${key} already exists`);
    }
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


// 2. Service – work with a consistent signature
const verifyOTP = async (phoneNumber, otpCode) => {
  try {
    const formattedNumber = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+${phoneNumber}`;
      console.log(`Formatted phone number: ${formattedNumber}`);
      console.log(`OTP Code: ${otpCode}`);

    // Twilio call – otpCode is already a string
    const verificationCheck = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID)
      .verificationChecks
      .create({ to: formattedNumber, code: otpCode });
      
    if (verificationCheck.status !== 'approved')
      throw new Error('Invalid OTP code');

    // update DB (make sure the field name matches your schema)
    await CompanyDetails.findOneAndUpdate(
      { phoneNumber },                  // phoneNumber === "+263..."
      { isContactVerified: true }
    );

    return { success: true, message: 'OTP verified successfully' };
  } catch (err) {
    throw new Error(`OTP verification failed: ${err.message}`);
  }
};



const getCompanyDetailsByTin = async (companyTIN) => {
  try {
    return await CompanyDetails.findOne({ companyTIN });
  } catch (error) {
    throw new Error(error.message);
  }
};

const loginCompany = async (companyTIN, phoneNumber) => {
  try {
    const company = await CompanyDetails.findOne({
      companyTIN,
      phoneNumber,
    });

    if (!company) {
      throw new Error("Invalid TIN or phone number");
    }

    if (!company.isContactVerified) {
      throw new Error("Phone number not verified. Please complete OTP verification.");
    }

    return {
      success: true,
      message: "Login successful",
      data: company,
    };
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
  loginCompany
};
