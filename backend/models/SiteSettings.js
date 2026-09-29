const mongoose = require("mongoose");

const siteSettingsSchema =
  new mongoose.Schema(
    {
      key: {
        type: String,
        default: "main",
        unique: true,
        trim: true,
      },

      siteName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
        default: "Disha The Academy",
      },

      tagline: {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
      },

      supportEmail: {
        type: String,
        trim: true,
        maxlength: 255,
        default: "",
      },

      supportPhone: {
        type: String,
        trim: true,
        maxlength: 30,
        default: "",
      },

      maintenanceMode: {
        type: Boolean,
        default: false,
      },

      notesSalesEnabled: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

module.exports =
  mongoose.models.SiteSettings ||
  mongoose.model(
    "SiteSettings",
    siteSettingsSchema
  );