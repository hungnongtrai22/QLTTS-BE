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

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const {
      _id,
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

    if (!_id) {
      return res.status(400).json({ message: 'Missing Contact ID (_id)' });
    }

    const updatedContact = await Contact.findByIdAndUpdate(
      _id,
      {
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
      },
      { new: true }
    );

    if (!updatedContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    return res.status(200).json({
      contact: updatedContact,
    });
  } catch (error) {
    console.error('[Update Contact API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
