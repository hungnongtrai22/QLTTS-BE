import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Gallery from 'src/models/gallery';

// _mock
import { withAuth } from 'src/utils/auth';
import db from '../../../utils/db';
// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    await db.connectDB();

    const {
      internId,
      postedAt,
      title,
      imageUrl,
      videoUrl,
      description
    } = req.body;
    const newGallery = await new Gallery({
      internId,
      postedAt,
      title,
      imageUrl,
      videoUrl,
      description,
      status: req?.body?.status
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

// Chưa siết về admin: form gọi endpoint này nằm trong trang hồ sơ TTS / nhật ký,
// vốn không có RoleBasedGuard nên mọi role đăng nhập đều vào được.
export default withAuth(handler);
