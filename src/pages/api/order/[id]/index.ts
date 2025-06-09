import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import 'src/models/intern'; // đảm bảo model Intern được đăng ký trước
import Order from 'src/models/order';
import db from 'src/utils/db';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


    const order = await Order.findById(req.query.id).populate('listIntern'); 
    res.status(200).json({
      order,
    });
  } catch (error) {
    console.error('[Order API]: ', error);
    res.status(400).json({
      message: error,
    });
  }
}
