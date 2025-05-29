import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Contact from 'src/models/contact';
import db from 'src/utils/db';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


    const contacts = await Contact.find(); 
    return res.status(200).json({
      contacts,
    });
  } catch (error) {
    console.error('[Product API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
