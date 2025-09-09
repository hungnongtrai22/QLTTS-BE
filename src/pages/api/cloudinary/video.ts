/* eslint-disable */

import { createRouter } from 'next-connect';
import cloudinary from 'cloudinary';
import fs from 'fs';
import fileUpload, { UploadedFile } from 'express-fileupload';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';
import cors from 'src/utils/cors';

// Interface mở rộng để có `files`
interface CustomNextApiRequest extends NextApiRequest {
  files: fileUpload.FileArray;
}

// Cloudinary config
cloudinary.v2.config({
  cloud_name: 'dj4gvts4q',
  api_key: '268454143367214',
  api_secret: 'LSq_5jOOP96udG0PrRjFkFzGD7k',
});

// Adapter: express middleware → Next.js
const expressFileUpload = fileUpload({ useTempFiles: true });

const fileUploadMiddleware = (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
  // @ts-ignore
  expressFileUpload(req, res, next);
};

// Router với kiểu request mở rộng
const router = createRouter<CustomNextApiRequest, NextApiResponse>().use(fileUploadMiddleware);

export const config = {
  api: {
    bodyParser: false,
  },
};

// POST: Upload file (ảnh hoặc video)
router.post(async (req, res) => {
  try {
    await cors(req, res);
    const { path } = req.body;
    const files = Object.values(req.files || {}).flat() as UploadedFile[];

    const uploadedResults = [];

    for (const file of files) {
      const result = await uploadToCloudinary(file, path);
      uploadedResults.push(result);
      removeTmp(file.tempFilePath);
    }

    return res.json(uploadedResults);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// Upload file lên cloudinary (ảnh hoặc video)
const uploadToCloudinary = async (
  file: UploadedFile,
  path: string
): Promise<{ url: string; public_url: string; type: string }> => {
  return new Promise((resolve, reject) => {
    const uploader =
      file.mimetype.startsWith('video/')
        ? cloudinary.v2.uploader.upload_large
        : cloudinary.v2.uploader.upload;

    uploader(
      file.tempFilePath,
      {
        folder: path,
        resource_type: 'auto', // auto detect (image / video / raw)
        chunk_size: 6000000, // áp dụng khi upload_large
      },
      (err, result) => {
        if (err || !result) {
          removeTmp(file.tempFilePath);
          console.error(err);
          return reject(new Error('Tải file lên không thành công.'));
        }

        resolve({
          url: result.secure_url,
          public_url: result.public_id,
          type: result.resource_type,
        });
      }
    );
  });
};

// Xoá file tạm sau khi upload
const removeTmp = (path: string) => {
  fs.unlink(path, (error) => {
    if (error) throw error;
  });
};

export default router.handler();