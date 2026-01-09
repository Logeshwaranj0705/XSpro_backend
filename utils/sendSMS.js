const axios = require("axios");

/**
 * Sends a DLT-compliant SMS via Fast2SMS
 * @param {string} phone 
 * @param {string} message 
 * @param {string} templateId 
 */
const sendSMS = async (phone, message, templateId) => {
  try {
    const cleanPhone = phone.toString().replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      console.error(`❌ Invalid phone number: ${phone}`);
      return null;
    }

    const payload = {
      route: "dlt_manual",
      sender_id: "XSPAYM",
      message: message,
      numbers: cleanPhone,
      entity_id: process.env.DLT_ENTITY_ID, 
      template_id: templateId,              
    };

    console.log(`📨 Sending SMS to ${cleanPhone} (Template: ${templateId})`);

    const response = await axios.post("https://www.fast2sms.com/dev/bulkV2", payload, {
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Fast2SMS Response:", response.data);
    return response.data;

  } catch (error) {
    const errorData = error.response?.data || error.message;
    console.error("❌ SMS Error Details:", JSON.stringify(errorData, null, 2));
    return null;
  }
};

module.exports = sendSMS;
