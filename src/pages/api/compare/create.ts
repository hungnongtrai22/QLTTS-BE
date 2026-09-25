import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Compare from 'src/models/compare';

// _mock
import { withAuth } from 'src/utils/auth';
import db from '../../../utils/db';
// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    await db.connectDB();

    const { account, listIntern } = req.body;
    const newCompare = await new Compare({
      account,
      listIntern,
    }).save();

    return res.status(200).json({
      compare: newCompare,
    });
  } catch (error) {
    console.error('[Auth API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}

export default withAuth(handler);
