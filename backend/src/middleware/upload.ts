import multer from 'multer';
import path from 'path';
import { ApiError } from '../utils/apiError';

const storage = multer.memoryStorage();

const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only image files (jpg, png, webp) are allowed.'));
  }
};

const pdfFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only PDF files are allowed.'));
  }
};

const imageOrPdfFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const imageTypes = /jpeg|jpg|png|webp/;
  const isImage = imageTypes.test(file.mimetype);
  const isPdf = file.mimetype === 'application/pdf';

  if (isImage || isPdf) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only images and PDF files are allowed.'));
  }
};

export const uploadImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).array('images', 5);

export const uploadPDF = multer({
  storage,
  fileFilter: pdfFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
}).single('file');

export const uploadAny = multer({
  storage,
  fileFilter: imageOrPdfFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
}).fields([
  { name: 'images', maxCount: 5 },
  { name: 'file', maxCount: 1 },
]);
