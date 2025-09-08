const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    channelType: {
      type: [String],
      required: true,
    },
    adPreference: {
      type: [String],
    },
    adType: {
      type: String,
      required: true,
    },
    requiredViews: {
      type: String,
      required: true,
    },
    requiredReporter: Number,
    pfState: {
      type: String,
    },
    pfCities: {
      type: [String],
      default: [],
    },
    adState: {
      type: String,
      required: true,
    },
    adCity: {
      type: String,
      required: true,
    },
    pincode: {
      type: Number,
    },
    couponCode: {
      type: String,
    },
    mediaType: {
      type: String,
      required: true,
    },
    mediaDescription: {
      type: String,
      required: true,
    },
    adLength: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    subtotal: {
      type: String,
      required: true,
    },
    gst: {
      type: String,
      required: true,
    },
    totalCost: {
      type: String,
      required: true,
    },
    adminCommission: Number,
    finalReporterPrice: Number,
    adCommissionRate: Number,

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "running", "completed"],
      default: "pending",
    },
    adminRejectNote: {
      type: String,
      default: "",
    },

    imageUrl: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    // Admin-only fields
    adminSelectState: [
      {
        type: String,
      },
    ],
    adminSelectCities: [
      {
        type: String,
      },
    ],
    adminSelectPincode: {
      type: Number,
    },
    reporterId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    allStates: {
      type: Boolean,
      default: false,
    },
    baseView: Number,
    acceptReporterCount: {
      type: Number,
      default: 0,
    },
    approvedAt: {
      type: Date,
    },
    acceptBefore: {
      type: Date,
    },
    acceptRejectReporterList: [
      {
        reporterId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        accepted: {
          type: Boolean,
        },
        adProof: {
          type: Boolean,
          default: false,
        },
        rejectNote: {
          type: String,
          default: "",
        },
        acceptedAt: {
          // ✅ Add this line
          type: Date,
        },
      },
    ],
  },
  { timestamps: true }
);

const Adpost = mongoose.model("Adpost", advertisementSchema);
module.exports = Adpost;
