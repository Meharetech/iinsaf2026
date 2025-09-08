const axios = require("axios");

const sendWhatsappOtp = async (mobile, otp, userName) => {
  try {
    const apiKey = process.env.AISENSY_API_KEY;

    const response = await axios.post("https://backend.aisensy.com/campaign/t1/api/v2", {
      apiKey,
      campaignName: "copy_otp",
      destination: `91${mobile}`,
      templateParams: [`${otp}`],
      buttons: [
        {
          type: "button",
          sub_type: "url",
          index: 0,
          parameters: [
            {
              type: "text",
              text: `${otp}`,
            },
          ],
        },
      ],
    });

    return response.data;
  } catch (error) {
    console.error("Error sending WhatsApp OTP:", error?.response?.data || error.message);
    throw new Error("Failed to send WhatsApp OTP");
  }
};

module.exports = sendWhatsappOtp;
