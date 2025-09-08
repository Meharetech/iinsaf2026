const mongoose = require("mongoose");

const ryvPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ryvUser",
      required: true,
    },
    name: { type: String, required: true },
    phoneNo: { type: String, required: true },
    email: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    residenceAddress: { type: String, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    aadharNo: { type: String, required: true },
    pancard: { type: String, required: true },
    description: { type: String, required: true },

    // Media fields
    image: { type: String },
    video: { type: String },

    // Post status
    status: {
      type: String,
      enum: ["under review", "approved", "completed", "rejected"],
      default: "under review",
    },

    rejectionNote: {
      type: String,
      default: "",
    },

    expireAt: {
      // TTL index field
      type: Date,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ryvPost", ryvPostSchema);
