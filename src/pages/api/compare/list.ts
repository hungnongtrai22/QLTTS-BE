import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import 'src/models/intern'; // đảm bảo model Intern được đăng ký trước
import Compare from 'src/models/compare';
import db from 'src/utils/db';
import { withAuth } from 'src/utils/auth';

// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


    const compares = await Compare.find().populate('listIntern'); 
    return res.status(200).json({
      compares,
    });
  } catch (error) {
    console.error('[Comapre API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}

export default withAuth(handler);
