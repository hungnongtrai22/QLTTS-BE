/* eslint-disable no-plusplus */

import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Intern from 'src/models/intern';
import db from 'src/utils/db';
import TradeUnion from 'src/models/tradeUnion';
import Company from 'src/models/company';
import Source from 'src/models/source';
import { withAuth } from 'src/utils/auth';
import { calculateAge } from 'src/utils/age';

// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const { source } = req.body;

    const interns = await Intern.find({ source })
      .populate({ path: 'tradeUnion', model: TradeUnion })
      .populate({ path: 'companySelect', model: Company })
      .populate({ path: 'source', model: Source })
      .lean();

    const internsWithAge = interns.map((intern) => ({
      ...intern,
      age: calculateAge(intern.birthday as Date),
    }));

    res.status(200).json({
      interns: internsWithAge,
    });
  } catch (error) {
    console.error('[Intern API]: ', error);
    res.status(400).json({
      message: error instanceof Error ? error.message : error,
    });
  }
}

export default withAuth(handler);
