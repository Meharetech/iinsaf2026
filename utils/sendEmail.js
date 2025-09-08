
// that is older version in this it create new transporter each time when i call it avoid to this i create another sending notification function

// const nodemailer = require("nodemailer");

// const sendEmail = async (to, subject, text) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: "Gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to,
//       subject,
//       text,
//     });

//     console.log(`Email sent to ${to}`);
//   } catch (err) {
//     console.error("Email error:", err.message);
//   }
// };

// module.exports = sendEmail;






const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text, html) => {
  try {
    await transporter.sendMail({
      from: `"iinsaf" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Email error:", err.message);
  }
};

module.exports = sendEmail;
