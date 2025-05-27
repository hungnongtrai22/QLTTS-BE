import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Intern from 'src/models/intern';
import db from 'src/utils/db';
import TradeUnion from 'src/models/tradeUnion';
import Company from 'src/models/company';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


    const interns = await Intern.find().populate({ path: "tradeUnion", model: TradeUnion }).populate({ path: "companySelect", model: Company }); 
    res.status(200).json({
      interns,
    });
  } catch (error) {
    console.error('[Product API]: ', error);
    res.status(400).json({
      message: error,
    });
  }
}
