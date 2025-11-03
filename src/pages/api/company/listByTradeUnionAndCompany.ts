import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Company from 'src/models/company';
import TradeUnion from 'src/models/tradeUnion';
import db from 'src/utils/db';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const { tradeUnion, companySelect } = req.body;

    const query: any = {};

    if (tradeUnion) {
      query.tradeUnion = tradeUnion;
    }

    // Nếu gửi vào mảng id công ty thì lọc theo mảng đó
    if (companySelect && Array.isArray(companySelect) && companySelect.length > 0) {
      query._id = { $in: companySelect };
    }

    const companies = await Company.find(query)
      .populate({ path: 'tradeUnion', model: TradeUnion });

    return res.status(200).json({ companies });
  } catch (error) {
    console.error('[Company API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
