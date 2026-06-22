import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with inline credentials
cloudinary.config({
  cloud_name: "doh00coks",
  api_key: "111473792778163",
  api_secret: "X3yN-IAaw6rsWtz_7X3-9dcQYoQ",
});

// 1. Upload a sample image from Cloudinary's demo domain
console.log("Uploading image...");
const uploadResult = await cloudinary.uploader.upload(
  "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  { public_id: "onboarding_sample" }
);

console.log("Uploaded image URL:", uploadResult.secure_url);
console.log("Public ID:", uploadResult.public_id);

// 2. Fetch and print image metadata
console.log("\nFetching image details...");
const details = await cloudinary.api.resource(uploadResult.public_id);

console.log("Width:", details.width);
console.log("Height:", details.height);
console.log("Format:", details.format);
console.log("File size (bytes):", details.bytes);

// 3. Generate a transformed URL
//    f_auto — automatically selects the best format for the user's browser (e.g. WebP, AVIF)
//    q_auto — automatically picks the best quality level to reduce file size without visible loss
const transformedUrl = cloudinary.url(uploadResult.public_id, {
  transformation: [{ fetch_format: "auto", quality: "auto" }],
  secure: true,
});

console.log("\nDone! Click link below to see optimized version of the image. Check the size and the format.");
console.log("Transformed URL:", transformedUrl);
