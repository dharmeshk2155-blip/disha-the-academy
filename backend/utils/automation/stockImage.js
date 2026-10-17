// Real topic photos from Pexels (free API). The photo is copied to our own
// Cloudinary folder, so the site never depends on Pexels being online and the
// 30-day cleanup can remove it together with the post.

const { v2: cloudinary } = require("cloudinary");

const FOLDER = "disha-the-academy/current-affairs";

function configured() {
  return Boolean(process.env.PEXELS_API_KEY);
}

function cleanQuery(q) {
  return String(q || "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

async function searchPhotos(query, count = 12) {
  if (!configured()) throw new Error("Photo search is not set up (PEXELS_API_KEY is missing).");

  const q = cleanQuery(query);
  if (!q) throw new Error("Type a few words to search for.");

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${count}&orientation=landscape`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Authorization: process.env.PEXELS_API_KEY },
    });
    if (response.status === 429) throw new Error("Photo search limit reached. Try again later.");
    if (!response.ok) throw new Error(`Photo search failed (HTTP ${response.status}).`);

    const data = await response.json();
    return (data.photos || []).map((p) => ({
      id: p.id,
      thumb: p.src?.medium || p.src?.small,
      src: p.src?.large2x || p.src?.large,
      photographer: p.photographer,
      pageUrl: p.url,
      alt: p.alt || "",
    }));
  } catch (error) {
    throw error.name === "AbortError" ? new Error("Photo search timed out.") : error;
  } finally {
    clearTimeout(timer);
  }
}

// copy one chosen photo into Cloudinary; returns { imageUrl, credit, creditUrl }
async function storePhoto({ src, photographer, pageUrl }) {
  if (!/^https:\/\/images\.pexels\.com\//i.test(String(src || ""))) {
    throw new Error("Only Pexels photos can be added this way.");
  }
  if (!process.env.CLOUDINARY_API_SECRET) throw new Error("Image storage (Cloudinary) is not set up.");

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const result = await cloudinary.uploader.upload(src, {
    folder: FOLDER,
    resource_type: "image",
    transformation: [{ width: 1400, height: 800, crop: "limit", quality: "auto", fetch_format: "auto" }],
  });

  const name = String(photographer || "").trim().slice(0, 80) || "Pexels photographer";
  const link = /^https:\/\/www\.pexels\.com\//i.test(String(pageUrl || "")) ? pageUrl : "https://www.pexels.com";

  return { imageUrl: result.secure_url, credit: `Photo by ${name} on Pexels`, creditUrl: link };
}

// automatic: pick the first result for the draft's search words
async function attachStockImage(draft) {
  if (!configured() || draft.imageUrl) return false;
  const query = draft.imageQuery || draft.title;

  try {
    const photos = await searchPhotos(query, 5);
    if (!photos.length) return false;
    const stored = await storePhoto(photos[0]);
    draft.imageUrl = stored.imageUrl;
    draft.imageCredit = stored.credit;
    draft.imageCreditUrl = stored.creditUrl;
    await draft.save();
    return true;
  } catch (error) {
    console.error("Stock image skipped:", error.message);
    return false;
  }
}

module.exports = { configured, searchPhotos, storePhoto, attachStockImage, cleanQuery };
