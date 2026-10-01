const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 150,
      index: true,
    },

    mobile: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
    },

    passwordHash: {
      type: String,
      default: "",
    },
    resetOTPHash: {
  type: String,
  default: null,
},

resetOTPExpiry: {
  type: Date,
  default: null,
},

resetOTPRequestedAt: {
  type: Date,
  default: null,
},

    resetOTPAttempts: {
      type: Number,
      default: 0,
    },

    loginOTPHash: {
      type: String,
      default: null,
    },

    loginOTPExpiry: {
      type: Date,
      default: null,
    },

    loginOTPRequestedAt: {
      type: Date,
      default: null,
    },

    loginOTPAttempts: {
      type: Number,
      default: 0,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Last time the user opened the notification bell
    // (see routes/notifications.js)
    notificationsSeenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);