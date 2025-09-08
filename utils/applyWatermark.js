const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

ffmpeg.setFfmpegPath(ffmpegPath);

// Ensure temp folder exists
const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}



const applyWatermark = async (inputPath, type = "video") => {
  const ext = path.extname(inputPath);
  const baseName = path.basename(inputPath, ext);
  const outputPath = path.join(tempDir, `${baseName}_watermarked${ext}`);
  const watermarkText = "official@iinsaf"

  console.log(`🔧 Watermarking ${type}:`, inputPath);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`❌ Input file not found: ${inputPath}`);
  }

  const stats = fs.statSync(inputPath);
  console.log("📏 Input file size:", stats.size);

  if (type === "image") {
    const image = sharp(inputPath);
    const { width, height } = await image.metadata();

    const fontSize = Math.floor(Math.min(width, height) * 0.08); // 8% of smaller dimension
    const x = width - 20; // Padding from right
    const y = height - 20; // Padding from bottom

    const svgText = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      text {
        font-size: ${fontSize}px;
        fill: rgba(255, 255, 255, 0.7);
        stroke: black;
        stroke-width: 1;
        font-family: Arial, sans-serif;
        text-anchor: end;
        dominant-baseline: bottom;
      }
    </style>
    <text x="${x}" y="${y}">${watermarkText}</text>
  </svg>
`;

    try {
      await image
        .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
        .toFile(outputPath);

      console.log(`✅ Image watermarked saved to: ${outputPath}`);
      return outputPath;
    } catch (err) {
      console.error("❌ Error in sharp watermark:", err);
      throw err;
    }
  }

  if (type === "video") {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec("libx264")
        .format("mp4")
        .outputOptions([
          `-vf drawtext=text='${watermarkText}':x=20:y=20:fontsize=48:fontcolor=white@0.7:box=1:boxcolor=black@0.3:boxborderw=5`,
        ])
        .on("end", () => {
          console.log(`✅ Video watermarked saved to: ${outputPath}`);
          resolve(outputPath);
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg error:", err);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          reject(err);
        })
        .save(outputPath);
    });
  }

  throw new Error(`❌ Unsupported media type: ${type}`);
};

module.exports = applyWatermark;
