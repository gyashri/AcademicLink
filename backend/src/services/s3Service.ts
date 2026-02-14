import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET } from '../config/s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// Local uploads directory for development fallback
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const isS3Configured = (): boolean => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key' &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_SECRET_ACCESS_KEY !== 'your_aws_secret_key'
  );
};

const ensureUploadsDir = (folder: string): void => {
  const dir = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const uploadToS3 = async (
  buffer: Buffer,
  originalName: string,
  mimetype: string,
  folder: string
): Promise<string> => {
  const ext = originalName.split('.').pop();
  const key = `${folder}/${uuidv4()}.${ext}`;

  if (!isS3Configured()) {
    // Local storage fallback
    ensureUploadsDir(folder);
    const localPath = path.join(UPLOADS_DIR, key);
    fs.writeFileSync(localPath, buffer);
    console.log(`[Local Storage] Saved: ${key}`);
    return key;
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  return key;
};

export const getSignedDownloadUrl = async (key: string, expiresIn = 3600): Promise<string> => {
  if (!isS3Configured()) {
    // Return local URL for development
    return `/uploads/${key}`;
  }

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  if (!isS3Configured()) {
    const localPath = path.join(UPLOADS_DIR, key);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    return;
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
  );
};
