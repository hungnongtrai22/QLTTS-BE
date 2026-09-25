import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Diary from 'src/models/diary';
import db from 'src/utils/db';
import Intern from 'src/models/intern';
import { withAuth } from 'src/utils/auth';

// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const diary = await Diary.findById(req.query.id).populate({ path: 'intern', model: Intern });
    return res.status(200).json({
      diary,
    });
  } catch (error) {
    console.error('[Product API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}

export default withAuth(handler);
