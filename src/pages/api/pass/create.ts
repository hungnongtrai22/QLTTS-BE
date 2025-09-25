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

    // const { name } = req.body;
    const newPass = await new Pass({
      field: req?.body?.field || '',
      citizenId: req?.body?.citizenId || '',
      citizenDate: req?.body?.citizenDate || '',
      citizenPlace: req?.body?.citizenPlace || '',
      passportId: req?.body?.passportId || '',
      passportDate: req?.body?.passportDate || '',
      reff: req?.body?.reff || '',
      street: req?.body?.street || '',
      state: req?.body?.state || '',
      city: req?.body?.city || '',
      postelCode: req?.body?.postelCode || '',
      country: req?.body?.country || '',
      phone: req?.body?.phone || '',
      contractId: req?.body?.contractId || '',
      contractDate: req?.body?.contractDate || '',
      contractPeriod: req?.body?.contractPeriod || '',
      contractResult: req?.body?.contractResult || '',
      departureDate: req?.body?.departureDate || '',
      profileStatus: req?.body?.profileStatus || '',
      orderId: req?.body?.orderId || '',
      description: req?.body?.description || '',
    }).save();

    return res.status(200).json({
      pass: newPass,
    });
  } catch (error) {
    console.error('[Auth API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
