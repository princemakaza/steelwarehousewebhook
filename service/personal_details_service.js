const PersonalDetails = require("../models/personal_details");
const stringSimilarity = require('string-similarity');

const twilioClient = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
// Service to create new personal details
const createPersonalDetails = async (personalDetailsData) => {
  try {
    // Check for existing email
    const existingEmail = await PersonalDetails.findOne({ 
      email: personalDetailsData.email 
    });
    if (existingEmail) throw new Error('Email already exists');

    // Check for existing contact number
    const existingContact = await PersonalDetails.findOne({ 
      contactNumber: personalDetailsData.contactNumber 
    });
    if (existingContact) throw new Error('Contact number already exists');

    // Create new entry
    const newPersonalDetails = new PersonalDetails(personalDetailsData);
    await newPersonalDetails.save();
    return newPersonalDetails;
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const key = Object.keys(error.keyPattern)[0];
      throw new Error(`${key.split(/(?=[A-Z])/).join(' ').toLowerCase()} already exists`);
    }
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



// Service for login using contact number and fuzzy name matching
const loginByContactAndName = async (contactNumber, name) => {
  try {
    // Find by contact number (exact match)
    const user = await PersonalDetails.findOne({ contactNumber });
    
    if (!user) {
      throw new Error('User not found with this contact number');
    }

    // Calculate name similarity (case-insensitive)
    const similarity = stringSimilarity.compareTwoStrings(
      name.toLowerCase(),
      user.name.toLowerCase()
    );

    // Check if similarity meets threshold (85%)
    if (similarity < 0.85) {
      throw new Error('Name does not match our records closely enough');
    }

    // Check contact verification status
    if (!user.isContactVerified) {
      throw new Error('Contact number not verified. Please verify first.');
    }

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber
      }
    };
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
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
  loginByContactAndName
};
