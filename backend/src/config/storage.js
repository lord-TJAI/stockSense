'use strict';

const path = require('path');
const env = require('./env');

let storageService;

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  storageService = {
    async upload(filePath, options = {}) {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'stocksense',
        ...options,
      });
      return result.secure_url;
    },
    async delete(publicId) {
      await cloudinary.uploader.destroy(publicId);
    },
  };
  console.log('[Storage] Using Cloudinary');
} else {
  // Local disk fallback for dev
  storageService = {
    async upload(filePath) {
      // Return a relative URL for locally saved files
      const filename = path.basename(filePath);
      return `/uploads/${filename}`;
    },
    async delete(filePath) {
      const fs = require('fs/promises');
      try {
        await fs.unlink(filePath);
      } catch {
        // ignore missing file
      }
    },
  };
  console.log('[Storage] Using local disk (dev fallback) — configure Cloudinary for production');
}

module.exports = storageService;
