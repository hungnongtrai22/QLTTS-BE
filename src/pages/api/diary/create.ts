import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Diary from 'src/models/diary';
// _mock
import db from '../../../utils/db';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    await db.connectDB();

    const { name } = req.body;
    const newDiary = await new Diary({
      name,
      intern: req?.body?.intern || "",
      status: req?.body?.status || "",
      direction: req?.body?.direction || "",
      startDate: req?.body?.startDate,
      endDate: req?.body?.endDate || "",
      time: req?.body?.time,
      description: req?.body?.description,
      person: req?.body?.person
    }).save();

    return res.status(200).json({
      diary: newDiary,
    });
  } catch (error) {
    console.error('[Auth API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
