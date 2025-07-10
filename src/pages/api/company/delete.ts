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

    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing company _id' });
    }

    const deletedCompany = await Company.findByIdAndDelete(_id);

    if (!deletedCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }

    return res.status(200).json({
      message: 'Company deleted successfully',
      company: deletedCompany,
    });
  } catch (error) {
    console.error('[Delete Company API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
