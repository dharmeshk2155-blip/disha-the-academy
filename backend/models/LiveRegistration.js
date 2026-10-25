// "I will give this live test" - one row per student per live test.
// sentStages remembers which reminder emails (minutes before start) went out.

const mongoose = require("mongoose");

const liveRegistrationSchema = new mongoose.Schema(
  {
    liveId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveTest", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sentStages: { type: [Number], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

liveRegistrationSchema.index({ liveId: 1, userId: 1 }, { unique: true });

module.exports =
  mongoose.models.LiveRegistration || mongoose.model("LiveRegistration", liveRegistrationSchema);
