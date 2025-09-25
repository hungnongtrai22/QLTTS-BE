import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Pass from 'src/models/pass';
// _mock
import db from '../../../utils/db';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    await db.connectDB();

    const {
      field,
      citizenId,
      citizenDate,
      citizenPlace,
      passportId,
      passportDate,
      reff,
      street,
      state,
      city,
      postelCode,
      country,
      phone,
      contractId,
      contractDate,
      contractPeriod,
      contractResult,
      departureDate,
      profileStatus,
      orderId,
      description,
    } = req.body;
    const updatedPass = await Pass.findByIdAndUpdate(
      {
        field,
        citizenId,
        citizenDate,
        citizenPlace,
        passportId,
        passportDate,
        reff,
        street,
        state,
        city,
        postelCode,
        country,
        phone,
        contractId,
        contractDate,
        contractPeriod,
        contractResult,
        departureDate,
        profileStatus,
        orderId,
        description,
      },
      { new: true }
    );

    return res.status(200).json({
      pass: updatedPass,
    });
  } catch (error) {
    console.error('[Pass API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
