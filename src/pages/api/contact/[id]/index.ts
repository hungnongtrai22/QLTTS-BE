import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import db from 'src/utils/db';
import Contact from 'src/models/contact';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


    const intern = await Contact.findById(req.query.id); 
    res.status(200).json({
      intern,
    });
  } catch (error) {
    console.error('[Product API]: ', error);
    res.status(400).json({
      message: error,
    });
  }
}
