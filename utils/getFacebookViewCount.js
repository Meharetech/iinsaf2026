require("dotenv").config();
const axios = require("axios");


const getFacebookViewCount = async (videoUrl) => {
  try {
    // console.log("🌐 Calling internal Facebook view count API...");
    
    const response = await axios.get(process.env.FACEBOOK_VIEW_ACCESS,{
      params: { url: videoUrl }
    });


    // console.log("that is the response of fb views",response.data);
    const rawViews = response.data.views; // Example: "78 views"
    // console.log("📊 Facebook API Response:", rawViews);


    return rawViews

    // Extract just the numeric portion
    // const numericMatch = rawViews.match(/[\d,.]+/);
    // return numericMatch ? numericMatch[0] : null;

  } catch (error) {
    if (error.response) {
      console.error("🔴 Facebook Internal API Error:", error.response.data);
    } else {
      console.error("❌ Error in getFacebookViewCount:", error.message);
    }
    return null;
  }
};

module.exports = getFacebookViewCount;
