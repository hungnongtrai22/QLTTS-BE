import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Order from 'src/models/order';

// _mock
import db from '../../../utils/db';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    await db.connectDB();

    const {
      name,
      priority,
      interviewFormat,
      status,
      recruitmentDate,
      work,
      description,
      contractPeriod,
      ageFrom,
      ageTo,
      quantity,
      quantityMen,
      quantityWomen,
      married,
      study,
      applicationConditions,
      insurance,
      housingConditions,
      livingConditions,
      otherLivingConditions,
      listWorker,
      listIntern,
    } = req.body;
    const newOrder = await new Order({
      name,
      priority,
      interviewFormat,
      status,
      recruitmentDate,
      work,
      description,
      contractPeriod,
      ageFrom,
      ageTo,
      quantity,
      quantityMen,
      quantityWomen,
      married,
      study,
      applicationConditions,
      insurance,
      housingConditions,
      livingConditions,
      otherLivingConditions,
      listWorker,
      listIntern,
    }).save();

    return res.status(200).json({
      order: newOrder,
    });
  } catch (error) {
    console.error('[Auth API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
