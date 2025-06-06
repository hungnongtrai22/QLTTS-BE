import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Study from 'src/models/study';
import db from 'src/utils/db';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


    const study = await Study.findById(req.query.id); 
    res.status(200).json({
      study,
    });
  } catch (error) {
    console.error('[Study API]: ', error);
    res.status(400).json({
      message: error,
    });
  }
}
