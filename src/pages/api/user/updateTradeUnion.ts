import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import db from '../../../utils/db';
import Intern from '../../../models/intern';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing intern ID (_id)' });
    }

    const comp = req?.body?.companySelect;

    const updatedIntern = await Intern.findByIdAndUpdate(
      _id,
      {
        tradeUnion: req?.body?.tradeUnion,
        companySelect: comp === "" ? null : comp,
        job: req?.body?.job,
        interviewDate: req?.body?.interviewDate,
        studyDate: req?.body?.studyDate,
        startDate: req?.body?.startDate,
        source: req?.body?.source
      },
      { new: true }
    );

    if (!updatedIntern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    return res.status(200).json({
      intern: updatedIntern,
    });
  } catch (error) {
    console.error('[Update Intern API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
