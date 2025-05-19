import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Company from 'src/models/company';
// _mock
import db from '../../../utils/db';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    await db.connectDB();

    const { name, } = req.body;
    const newTradeUnion = await new Company({
      name,
      email: req?.body?.email || "",
      address: req?.body?.address || "",
      city: req?.body?.city || "",
      state: req?.body?.state || "",
      country: req?.body?.country || "",
      phone: req?.body?.phone || "",
      tradeUnion: req?.body?.tradeUnion || "",
    }).save();

    return res.status(200).json({
      tradeUnion: newTradeUnion,
    });
  } catch (error) {
    console.error('[Auth API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
