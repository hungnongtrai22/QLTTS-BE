import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Pass from 'src/models/pass';
import Order from 'src/models/order';
import db from 'src/utils/db';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


    const passes = await Pass.find().populate({ path: "order", model: Order }); 
    return res.status(200).json({
      passes,
    });
  } catch (error) {
    console.error('[Pass API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
