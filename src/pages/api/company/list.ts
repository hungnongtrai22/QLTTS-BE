import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Company from 'src/models/company';
import db from 'src/utils/db';
import TradeUnion from 'src/models/tradeUnion';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


    const companies = await Company.find().populate({ path: "tradeUnion", model: TradeUnion }); 
    return res.status(200).json({
      companies,
    });
  } catch (error) {
    console.error('[Company API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
