const mongoose = require("mongoose");

const freeAdsSchema = new mongoose.Schema({
  adType: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
  },
  videoUrl: {
    type: String,
  },
  description: {
    type: String,
  },
  state: [
    {
      type: String,
    },
  ],
  city: [
    {
      type: String,
    },
  ],
  allState: {
    type: Boolean,
    default: false,
  },

  requiredReportersCount: { type: Number, default: 0 },

  // ✅ All reporters selected for this ad
  selectedReporters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  // ✅ Per-reporter status tracking
  acceptedReporters: [
    {
      reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      postStatus: {
        type: String,
        enum: ["pending", "accepted","submitted","completed"],
        default: "pending",
      },
      acceptedAt: {
        type: Date,
      },
      completedAt: {
        type: Date,
      },
      // ✅ New field for storing ad proof
      adProof: {
        type: String, // could be a URL to image/video proof
      }
    },
  ],

  // ✅ Overall ad status
  status: {
    type: String,
    enum: ["approved","running","completed"],
    default: "approved",
  },
},
{ timestamps: true },   // ✅ This adds createdAt & updatedAt automatically

);

module.exports = mongoose.model("freeAdModel", freeAdsSchema);
