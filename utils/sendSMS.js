const axios = require("axios");

async function sendSMS(phone, message) {
    try {
        const apiKey = process.env.FAST2SMS_API_KEY;
        const numbers = Array.isArray(phone) ? phone : [phone];
        const toNumbers = numbers
            .map(num => num.replace("+91", ""))
            .join(",");

        const response = await axios.post(
            "https://www.fast2sms.com/dev/bulkV2",
            {
                route: "v3",  
                sender_id: "XSPAYM",    
                message: message,
                numbers: toNumbers,
            },
            {
                headers: {
                    authorization: apiKey,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Fast2SMS Response:", response.data);
        return true;

    } catch (error) {
        console.error(
            "Fast2SMS Error:",
            error.response?.data || error.message
        );
        return false;
    }
}

module.exports = sendSMS;
