const sendEmail = require('../utils/sendEmail');
const sendWhatsappNotification = require('../utils/sendWhatsappNotification');
const User = require('../models/userModel/userModel');

const notifyMatchingReporters = async (ad) => {
  try {
    console.log("Ad data for sending notification:", ad);

    // Step 1: Find all reporters
    const reporters = await User.find({ role: 'Reporter' });
    console.log("All reporters:", reporters.length);

    let matchedReporters = [];

    // 🔹 1st Preference: reporterId
    if (Array.isArray(ad.reporterId) && ad.reporterId.length > 0) {
      matchedReporters = reporters.filter(r =>
        ad.reporterId.includes(String(r._id))
      );
      console.log("Matched by reporterId:", matchedReporters.length);

    // 🔹 2nd Preference: adminSelectState / adminSelectCities
    } else if (
      (Array.isArray(ad.adminSelectState) && ad.adminSelectState.length > 0) ||
      (Array.isArray(ad.adminSelectCities) && ad.adminSelectCities.length > 0)
    ) {
      matchedReporters = reporters.filter(r =>
        (Array.isArray(ad.adminSelectState) && ad.adminSelectState.includes(r.state)) ||
        (Array.isArray(ad.adminSelectCities) && ad.adminSelectCities.includes(r.city))
      );
      console.log("Matched by adminSelectState/adminSelectCities:", matchedReporters.length);

    // 🔹 3rd Preference: allStates
    } else if (ad.allStates === true) {
      matchedReporters = reporters;
      console.log("Matched by allStates:", matchedReporters.length);

    // 🔹 4th Preference: pfState / pfCities / adState / adCity
    } else {
      matchedReporters = reporters.filter(r =>
        (ad.pfState && r.state === ad.pfState) ||
        (Array.isArray(ad.pfCities) && ad.pfCities.includes(r.city)) ||
        (ad.adState && r.state === ad.adState) ||
        (ad.adCity && r.city === ad.adCity)
      );
      console.log("Matched by pfState/pfCities/adState/adCity:", matchedReporters.length);
    }

    // 🚫 Stop if no reporters matched
    if (!matchedReporters || matchedReporters.length === 0) {
      console.log("⚠️ No matched reporters, no notifications sent.");
      return;
    }

    // Step 3: Send notifications
    const message = `📰 New Ad Approved: "${ad.mediaDescription || 'Untitled'}"`;

    for (const reporter of matchedReporters) {
      if (reporter.email) {
        console.log(`📧 Sending email to: ${reporter.email}`);
        await sendEmail(reporter.email, "Ad Notification", message);
      }
      if (reporter.mobile) {
        console.log(`📱 Sending WhatsApp to: ${reporter.mobile}`);
        await sendWhatsappNotification(reporter.mobile, ad.mediaDescription || 'New Ad', ad._id);
      }
    }

    console.log(`✅ Notifications sent to ${matchedReporters.length} reporters.`);

  } catch (err) {
    console.error("Error notifying reporters:", err.message);
  }
};

module.exports = notifyMatchingReporters;
