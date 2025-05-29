import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Contact from 'src/models/contact';

// _mock
import db from '../../../utils/db';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    await db.connectDB();

    const {
      internId,
      address,
      email,
      phone,
      nameDad,
      addressDad,
      phoneDad,
      nameMom,
      addressMom,
      phoneMom,
    } = req.body;
    const newContact = await new  Contact({
      internId,
      address,
      email,
      phone,
      nameDad,
      addressDad,
      phoneDad,
      nameMom,
      addressMom,
      phoneMom,
    }).save();

    return res.status(200).json({
      contact: newContact,
    });
  } catch (error) {
    console.error('[Auth API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
