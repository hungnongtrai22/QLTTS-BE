import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import 'src/models/intern'; // đảm bảo model Intern được đăng ký trước
import Gallery from 'src/models/gallery';
import Intern from 'src/models/intern';

import db from 'src/utils/db';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const { internId, status } = req.query;

    let filter: any = {};

    // Nếu có internId => lấy gallery của intern đó + gallery có status = "Tất cả"
    if (internId && internId !== 'Tất cả') {
      filter = {
        $or: [
          { internId },
          { status: 'Tất cả' },
        ],
      };
    }

    // Nếu có status riêng mà khác "Tất cả" => ghi đè filter
    if (status && status !== 'Tất cả') {
      filter = { status };
    }

    const galleries = await Gallery.find(filter);

    return res.status(200).json({
      galleries,
    });
  } catch (error) {
    console.error('[Gallery API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : error,
    });
  }
}
