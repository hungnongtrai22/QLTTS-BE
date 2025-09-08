import { createRouter } from 'next-connect';
import cloudinary from 'cloudinary';
import fs from 'fs';
import fileUpload, { UploadedFile } from 'express-fileupload';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';
import cors from 'src/utils/cors';

// Tạo interface mở rộng để có `files`
interface CustomNextApiRequest extends NextApiRequest {
  files: fileUpload.FileArray;
}

// Khai báo cấu hình cloudinary
cloudinary.v2.config({
  cloud_name: 'dj4gvts4q',
  api_key: '268454143367214',
  api_secret: 'LSq_5jOOP96udG0PrRjFkFzGD7k',
});

// Adapter: chuyển express middleware thành middleware tương thích Next.js
const expressFileUpload = fileUpload({ useTempFiles: true });

const fileUploadMiddleware = (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
  // @ts-ignore: ignore type mismatch
  expressFileUpload(req, res, next);
};

// Tạo router với kiểu request mở rộng
const router = createRouter<CustomNextApiRequest, NextApiResponse>().use(fileUploadMiddleware);

export const config = {
  api: {
    bodyParser: false,
  },
};

// POST: Upload video
router.post(async (req, res) => {
  try {
    await cors(req, res);
    const { path } = req.body;
    const files = Object.values(req.files || {}).flat() as UploadedFile[];

    const videos = [];

    /* eslint-disable no-restricted-syntax, no-await-in-loop */
    for (const file of files) {
      const vid = await uploadVideoToCloudinaryHandler(file, path);
      videos.push(vid);
      removeTmp(file.tempFilePath);
    }
    /* eslint-enable no-restricted-syntax, no-await-in-loop */

    return res.json(videos);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// Upload video lên cloudinary
const uploadVideoToCloudinaryHandler = async (
  file: UploadedFile,
  path: string
): Promise<{ url: string; public_url: string }> => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload_large(
      file.tempFilePath,
      {
        folder: path,
        resource_type: 'video', // bắt buộc để Cloudinary hiểu là video
        chunk_size: 6000000, // (tùy chọn) chia nhỏ khi upload file lớn
      },
      (err, result) => {
        if (err || !result) {
          removeTmp(file.tempFilePath);
          console.error(err);
          return reject(new Error('Tải video lên không thành công.'));
        }

        resolve({
          url: result.secure_url,
          public_url: result.public_id,
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
