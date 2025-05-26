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

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { _id, name, email, address, city, state, country, phone, tradeUnion, description } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing company ID (_id)' });
    }

    const updatedCompany= await Company.findByIdAndUpdate(
      _id,
      {
        name,
        email,
        address,
        city,
        state,
        country,
        phone,
        tradeUnion,
        description
      },
      { new: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({ message: 'Trade Union not found' });
    }

    return res.status(200).json({
      company: updatedCompany,
    });
  } catch (error) {
    console.error('[Update Trade Union API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
