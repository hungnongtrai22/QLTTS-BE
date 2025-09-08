import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Gallery from 'src/models/gallery';

// _mock
import db from '../../../utils/db';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    await db.connectDB();

    const {
      internId,
      postedAt,
      title,
      imageUrl,
      videoUrl
    } = req.body;
    const newGallery = await new Gallery({
      internId,
      postedAt,
      title,
      imageUrl,
      videoUrl
    }).save();

    return res.status(200).json({
      gallery: newGallery,
    });
  } catch (error) {
    console.error('[Gallery API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
