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

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const {
      _id,
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
      married,
      study,
      applicationConditions,
      insurance,
    } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing Order (_id)' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      _id,
      {
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
        quantityMen: req?.body?.quantityMen || 0,
        quantityWomen: req?.body?.quantityWomen || 0,
        married,
        study,
        applicationConditions,
        insurance,
        housingConditions: req?.body?.housingConditions,
        livingConditions: req?.body?.livingConditions,
        otherLivingConditions: req?.body?.otherLivingConditions,
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({
      order: updatedOrder,
    });
  } catch (error) {
    console.error('[Update Order API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
