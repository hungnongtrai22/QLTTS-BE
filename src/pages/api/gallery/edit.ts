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

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { _id, internId, postedAt, title, imageUrl, videoUrl,description } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing gallery ID (_id)' });
    }

    const updatedGallery = await Gallery.findByIdAndUpdate(
      _id,
      {
        internId,
        postedAt,
        title,
        imageUrl,
        videoUrl,
        description,
        status: req?.body?.status
      },
      { new: true }
    );

    if (!updatedGallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    return res.status(200).json({
      gallery: updatedGallery,
    });
  } catch (error) {
    console.error('[Update Gallery API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
