/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */

import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Gallery from 'src/models/gallery';
// import { v2 as cloudinary } from 'cloudinary';

import db from '../../../utils/db';

// cloudinary



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

   if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing gallery id' });
    }

    // tìm gallery
    const gallery = await Gallery.findById(_id);
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // // xoá ảnh trên cloudinary
    // if (gallery.imageUrl && gallery.imageUrl.length > 0) {
    //   for (const url of gallery.imageUrl) {
    //     try {
    //       // Lấy public_id từ url (vd: https://res.cloudinary.com/.../upload/v1234567/abcxyz.jpg)
    //       const parts = url.split('/');
    //       const filename = parts[parts.length - 1]; // abcxyz.jpg
    //       const publicId = parts.slice(parts.indexOf('upload') + 1).join('/').split('.')[0]; // abcxyz (hoặc folder/abcxyz nếu có folder)

    //       await cloudinary.uploader.destroy(publicId);
    //     } catch (err) {
    //       console.error('Error deleting image from Cloudinary:', err);
    //     }
    //   }
    // }

    // xoá gallery trong DB
    await Gallery.findByIdAndDelete(_id);

    return res.status(200).json({ message: 'Gallery deleted successfully' });
  } catch (error) {
    console.error('[Gallery DELETE API]: ', error);
    return res.status(400).json({ message: error });
  }
}
