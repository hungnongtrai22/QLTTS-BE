import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Diary from 'src/models/diary';
import db from 'src/utils/db';
import Intern from 'src/models/intern';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


    const diaries = await Diary.find().populate({ path: 'intern', model: Intern });
    return res.status(200).json({
      diaries,
    });
  } catch (error) {
    console.error('[Diary API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
