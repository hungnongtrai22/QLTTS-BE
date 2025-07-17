import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Source from 'src/models/source';
import db from 'src/utils/db';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


    const source = await Source.findOne({name: req.body.name}); 
    return res.status(200).json({
      source,
    });
  } catch (error) {
    console.error('[Source API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
