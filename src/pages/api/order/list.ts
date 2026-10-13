import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import 'src/models/intern'; // đảm bảo model Intern được đăng ký trước
import Order from 'src/models/order';
import db from 'src/utils/db';
import { withAuth } from 'src/utils/auth';
import { withListInternAges } from 'src/utils/age';

// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


    const orders = await Order.find().populate('listIntern'); 
    return res.status(200).json({
      orders: orders.map(withListInternAges),
    });
  } catch (error) {
    console.error('[Product API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}

export default withAuth(handler);
