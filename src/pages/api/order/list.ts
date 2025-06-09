import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Order from 'src/models/order';
import db from 'src/utils/db';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


    const orders = await Order.find(); 
    return res.status(200).json({
      orders,
    });
  } catch (error) {
    console.error('[Product API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
