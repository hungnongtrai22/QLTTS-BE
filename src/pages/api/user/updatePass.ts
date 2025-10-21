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

    const updatedIntern = await Intern.findByIdAndUpdate(
      _id,
      {
        field: req?.body?.field,
        citizenId: req?.body?.citizenId,
        citizenDate: req?.body?.citizenDate,
        citizenPlace: req?.body?.citizenPlace,
        passportId: req?.body?.passportId,
        passportDate: req?.body?.passportDate,
        reff: req?.body?.reff,
        street: req?.body?.street,
        state: req?.body?.state,
        postelCode: req?.body?.postelCode,
        country: req?.body?.country,
        phone: req?.body?.phone,
        contractId: req?.body?.contractId,
        contractDate: req?.body?.contractDate,
        contractPeriod: req?.body?.contractPeriod,
        contractResult: req?.body?.contractResult,
        profileStatus: req?.body?.profileStatus,
        orderId: req?.body?.orderId,
        description: req?.body?.description,
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
