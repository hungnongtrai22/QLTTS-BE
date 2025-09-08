import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import 'src/models/intern'; // đảm bảo model Intern được đăng ký trước
import Gallery from 'src/models/gallery';
import db from 'src/utils/db';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


    const galleries = await Gallery.find().populate('internId'); 
    return res.status(200).json({
      galleries,
    });
  } catch (error) {
    console.error('[Gallery API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
