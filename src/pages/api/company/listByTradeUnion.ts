import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Company from 'src/models/company';
import TradeUnion from 'src/models/tradeUnion';

import db from 'src/utils/db';
import { withAuth } from 'src/utils/auth';
import { REF_NAME_SELECT, accountOf, isAdmin } from 'src/utils/internScope';

// ----------------------------------------------------------------------
// Công ty của một nghiệp đoàn. Nguồn / demo chỉ dùng để đổ bộ lọc nên chỉ nhận tên — Company
// còn chứa giám đốc, lương, thuế… của hợp đồng lao động.

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const { tradeUnion } = req.body;
    const admin = isAdmin(accountOf(req));

    const companies = await Company.find({ tradeUnion })
      .select(admin ? '' : `${REF_NAME_SELECT} tradeUnion`)
      .populate({ path: 'tradeUnion', model: TradeUnion, select: admin ? '' : REF_NAME_SELECT });
    return res.status(200).json({
      companies,
    });
  } catch (error) {
    console.error('[Company API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}

export default withAuth(handler, { roles: ['admin', 'source', 'demo'] });
