import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Source from 'src/models/source';
// _mock
import db from '../../../utils/db';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    await db.connectDB();

    const { name } = req.body;
    const newSource = await new Source({
      name,
      email: req?.body?.email || "",
      address: req?.body?.address || "",
      state: req?.body?.state || "",
      phone: req?.body?.phone || "",
    }).save();

    return res.status(200).json({
      source: newSource,
    });
  } catch (error) {
    console.error('[Auth API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
