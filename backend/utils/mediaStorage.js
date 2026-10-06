/* =====================================================
   MEDIA STORAGE  (images that come out of Word notes)

   - Cloudinary is used when CLOUDINARY_CLOUD_NAME / _API_KEY /
     _API_SECRET are set (same keys the blog already uses).
     Use this on Render: its disk is wiped on every deploy.
   - Otherwise images are written to  backend/uploads/notes  and
     served from  /uploads/notes/<file>  (fine for local work).
===================================================== */

const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "notes");

function cloudinaryReady() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/*
  saveNoteImage({ buffer, ext, baseUrl })  ->  public URL (string)
  baseUrl = address of this backend, used for the local fallback
*/
async function saveNoteImage({ buffer, ext, baseUrl }) {
  if (cloudinaryReady()) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "disha-the-academy/notes",
          resource_type: "image",
          transformation: [
            { width: 1600, crop: "limit", quality: "auto" },
          ],
        },
        (error, uploaded) => (error ? reject(error) : resolve(uploaded))
      );

      stream.end(buffer);
    });

    return result.secure_url;
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

  await fs.writeFile(path.join(UPLOAD_DIR, name), buffer);

  return `${String(baseUrl || "").replace(/\/+$/, "")}/uploads/notes/${name}`;
}

module.exports = { saveNoteImage, cloudinaryReady, UPLOAD_DIR };