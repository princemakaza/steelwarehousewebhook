const PersonalDetails = require("../models/personal_details");
const twilioClient = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
// Service to create new personal details
const createPersonalDetails = async (personalDetailsData) => {
    try {
        // Check if email already exists
        const existingDetails = await PersonalDetails.findOne({ email: personalDetailsData.email });
        if (existingDetails) {
            throw new Error('Email already exists');
        }

        // Create and save new personal details
        const newPersonalDetails = new PersonalDetails(personalDetailsData);
        await newPersonalDetails.save();
        return newPersonalDetails;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Service to get all personal details
const getAllPersonalDetails = async () => {
  try {
    return await PersonalDetails.find();
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to get personal details by contact number
const getPersonalDetailsByContactNumber = async (contactNumber) => {
  try {
    return await PersonalDetails.findOne({ contactNumber });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to get personal details by email
const getPersonalDetailsByEmail = async (email) => {
  try {
    return await PersonalDetails.findOne({ email });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to update personal details
const updatePersonalDetails = async (id, updateData) => {
  try {
    const updatedDetails = await PersonalDetails.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    if (!updatedDetails) {
      throw new Error("Personal details not found");
    }
    return updatedDetails;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to delete personal details
const deletePersonalDetails = async (id) => {
  try {
    const deletedDetails = await PersonalDetails.findByIdAndDelete(id);
    if (!deletedDetails) {
      throw new Error("Personal details not found");
    }
    return deletedDetails;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to generate and send OTP via SMS
const generateAndSendOTP = async (contactNumber) => {
    try {
        // First check if the contact number exists in the database
        const personalDetails = await PersonalDetails.findOne({ contactNumber });
        if (!personalDetails) {
            throw new Error('Contact number not found');
        }

        // Format the contact number for Twilio (assuming it needs + prefix)
        const formattedNumber = contactNumber.startsWith('+') ? contactNumber : `+${contactNumber}`;

        // Send OTP via Twilio Verify
        const verification = await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_ID)
            .verifications
            .create({ to: formattedNumber, channel: 'sms' });

        return { 
            success: true, 
            message: 'OTP sent successfully', 
            verificationSid: verification.sid 
        };
    } catch (error) {
        throw new Error(`Failed to send OTP: ${error.message}`);
    }
};

// Service to verify OTP
const verifyOTP = async (contactNumber, otpCode) => {
    try {
        // Format the contact number for Twilio
        const formattedNumber = contactNumber.startsWith('+') ? contactNumber : `+${contactNumber}`;

        // Verify the OTP with Twilio
        const verificationCheck = await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_ID)
            .verificationChecks
            .create({ to: formattedNumber, code: otpCode });

        if (verificationCheck.status === 'approved') {
            // Update the contact verification status in the database
            await PersonalDetails.findOneAndUpdate(
                { contactNumber },
                { isContactVerified: true }
            );
            return { success: true, message: 'OTP verified successfully' };
        } else {
            throw new Error('Invalid OTP code');
        }
    } catch (error) {
        throw new Error(`OTP verification failed: ${error.message}`);
    }
};


module.exports = {
  createPersonalDetails,
  getAllPersonalDetails,
  getPersonalDetailsByContactNumber,
  getPersonalDetailsByEmail,
  updatePersonalDetails,
  deletePersonalDetails,
  generateAndSendOTP,
  verifyOTP,
};
