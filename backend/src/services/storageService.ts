import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// Local uploads directory for development fallback
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const ensureUploadsDir = (folder: string): void => {
  const dir = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const uploadFile = async (
  buffer: Buffer,
  originalName: string,
  mimetype: string,
  folder: string
): Promise<string> => {
  const ext = originalName.split('.').pop();
  const publicId = `${folder}/${uuidv4()}`;

  if (!isCloudinaryConfigured()) {
    // Local storage fallback for development
    ensureUploadsDir(folder);
    const key = `${publicId}.${ext}`;
    const localPath = path.join(UPLOADS_DIR, key);
    fs.writeFileSync(localPath, buffer);
    console.log(`[Local Storage] Saved: ${key}`);
    return key;
  }

  // Upload to Cloudinary
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: `${uuidv4()}`,
        resource_type: 'auto', // Handles PDFs, images, etc.
        format: ext,
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload error:', error);
          reject(error);
        } else {
          console.log(`[Cloudinary] Uploaded: ${result?.secure_url}`);
          resolve(result!.secure_url);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

export const getFileUrl = async (key: string, expiresIn?: number): Promise<string> => {
  if (!isCloudinaryConfigured()) {
    // Return local URL for development
    return `/uploads/${key}`;
  }

  // If it's already a Cloudinary URL, return as is
  if (key.startsWith('http')) {
    return key;
  }

  // For legacy S3-style keys, construct Cloudinary URL
  // Note: Cloudinary URLs don't expire by default (expiresIn is ignored)
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${key}`;
};

export const deleteFile = async (key: string): Promise<void> => {
  if (!isCloudinaryConfigured()) {
    const localPath = path.join(UPLOADS_DIR, key);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    return;
  }

  // Extract public_id from URL or use key directly
  let publicId = key;
  if (key.startsWith('http')) {
    // Extract public_id from Cloudinary URL
    const matches = key.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    if (matches) {
      publicId = matches[1];
    }
  }

  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`[Cloudinary] Deleted: ${publicId}`);
  } catch (error) {
    console.error('[Cloudinary] Delete error:', error);
  }
};

// For backward compatibility with existing code
export const uploadToS3 = uploadFile;
export const getSignedDownloadUrl = getFileUrl;
export const deleteFromS3 = deleteFile;
