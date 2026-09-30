// ======================================================
// MANAGE ADMIN ACCOUNTS
//
// Run from the backend folder (needs MONGODB_URI in .env):
//
//   Create an admin (or reset password / unlock an existing one):
//     node scripts/manageAdmin.js --email you@example.com --name "Your Name"
//     -> asks for the password (typing is hidden)
//
//   Disable an admin (also logs them out immediately):
//     node scripts/manageAdmin.js --email you@example.com --disable
//
// For your two admins, just run the create command twice
// with the two different emails.
//
// Non-interactive (CI/scripts): set ADMIN_PASSWORD in the
// environment instead of typing it.
// ======================================================

require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});

const mongoose = require("mongoose");

const { connectMongoDB } = require("../mongoDb");
const Admin = require("../models/Admin");
const { hashPassword } = require("../utils/password");

const MIN_PASSWORD_LENGTH = 10;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--disable") {
      args.disable = true;
    } else if (arg === "--email") {
      args.email = argv[++i];
    } else if (arg === "--name") {
      args.name = argv[++i];
    }
  }

  return args;
}

// Reads a password without showing it (a * is printed per character).
// Uses raw keyboard mode instead of readline, because readline erases
// the "Password:" text on some Windows terminals.
function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    let value = "";

    process.stdout.write(question);

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    function finish() {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write("\n");
    }

    function onData(chunk) {
      for (const ch of chunk) {
        // Enter
        if (ch === "\r" || ch === "\n") {
          finish();
          resolve(value);
          return;
        }

        // Ctrl+C
        if (ch === "\u0003") {
          finish();
          console.log("Cancelled.");
          process.exit(130);
        }

        // Backspace
        if (ch === "\u007f" || ch === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }

        // ignore other control keys (arrows, tab, ...)
        if (ch < " ") {
          continue;
        }

        value += ch;
        process.stdout.write("*");
      }
    }

    stdin.on("data", onData);
  });
}

async function readPassword() {
  if (process.env.ADMIN_PASSWORD) {
    return process.env.ADMIN_PASSWORD;
  }

  if (!process.stdin.isTTY) {
    throw new Error(
      "No terminal to ask for a password. Set ADMIN_PASSWORD in the environment."
    );
  }

  const first = await askHidden("Password: ");
  const second = await askHidden("Repeat password: ");

  if (first !== second) {
    throw new Error("Passwords do not match.");
  }

  return first;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = String(args.email || "").trim().toLowerCase();

  if (!emailRegex.test(email)) {
    throw new Error(
      'Please pass a valid email: --email you@example.com [--name "Your Name"]'
    );
  }

  await connectMongoDB();

  // ---------------- DISABLE ----------------
  if (args.disable) {
    const result = await Admin.updateOne(
      { email },
      { $set: { isActive: false }, $inc: { tokenVersion: 1 } }
    );

    if (!result.matchedCount) {
      throw new Error(`No admin found with email ${email}`);
    }

    console.log(`Disabled ${email}. Their tokens stop working immediately.`);
    return;
  }

  // ---------------- CREATE / RESET ----------------
  const existing = await Admin.findOne({ email }).select("_id name").lean();

  const name = String(args.name || existing?.name || "").trim();

  if (!name) {
    throw new Error('A new admin needs a name: --name "Your Name"');
  }

  const password = await readPassword();

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
    );
  }

  await Admin.updateOne(
    { email },
    {
      $set: {
        name,
        passwordHash: hashPassword(password),
        isActive: true,
        loginAttempts: 0,
        lockUntil: null,
        lastAttemptAt: null,
      },
      // Old sessions of this admin are logged out
      $inc: { tokenVersion: 1 },
      $setOnInsert: { email },
    },
    { upsert: true }
  );

  console.log(
    existing
      ? `Updated admin ${email} (password reset, unlocked, old sessions logged out).`
      : `Created admin ${email}.`
  );
}

main()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("");
    console.error("Error:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });