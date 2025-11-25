import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';
// models
import Study from 'src/models/study';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const { internId, month, year } = req.body;

    if (!internId || !month || !year) {
      return res.status(400).json({ message: 'Missing internId, month, or year' });
    }

    const study = await Study.findOne({
      internId,
      $expr: {
        $and: [
          {
            $eq: [
              {
                $month: {
                  date: '$monthAndYear',
                  timezone: 'Asia/Ho_Chi_Minh',
                },
              },
              month,
            ],
          },
          {
            $eq: [
              {
                $year: {
                  date: '$monthAndYear',
                  timezone: 'Asia/Ho_Chi_Minh',
                },
              },
              year,
            ],
          },
        ],
      },
    });

    if (!study) {
      return res.status(200).json(null);
    }

    console.log(month, year);
        console.log(study.monthAndYear);


    return res.status(200).json({ study });
  } catch (error) {
    console.error('[Study API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
