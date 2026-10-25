// A scheduled live test. It points at an ordinary Test (questions, marks and
// duration are managed in the normal admin pages); this record only adds WHEN
// it is live and when the result opens.

const mongoose = require("mongoose");

const liveTestSchema = new mongoose.Schema(
  {
    testId: { type: String, required: true, trim: true, lowercase: true, index: true },

    startsAt: { type: Date, required: true, index: true },

    // fixed end: everybody's test closes at this moment (late joiners get less time)
    endsAt: { type: Date, required: true },

    // result + rank open this many minutes AFTER endsAt
    resultDelayMinutes: { type: Number, default: 120, min: 0, max: 7 * 24 * 60 },

    note: { type: String, default: "", trim: true, maxlength: 300 },

    status: { type: String, enum: ["scheduled", "cancelled"], default: "scheduled", index: true },

    createdBy: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.models.LiveTest || mongoose.model("LiveTest", liveTestSchema);
