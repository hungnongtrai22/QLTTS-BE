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
import {
  PARTNER_LIST_SELECT,
  REF_NAME_SELECT,
  accountOf,
  internScope,
  isAdmin,
} from 'src/utils/internScope';

// ----------------------------------------------------------------------
// Danh sách TTS của một nguồn. Tài khoản nguồn luôn nhận đúng nguồn của mình (mã nguồn gửi
// lên bị bỏ qua) và chỉ các trường của bảng danh sách.

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const account = accountOf(req);
    const admin = isAdmin(account);
    const { source } = req.body;
    const refSelect = admin ? '' : REF_NAME_SELECT;

    const interns = await Intern.find(admin ? { source } : internScope(account) || {})
      .select(admin ? '' : PARTNER_LIST_SELECT)
      .populate({ path: 'tradeUnion', model: TradeUnion, select: refSelect })
      .populate({ path: 'companySelect', model: Company, select: refSelect })
      .populate({ path: 'source', model: Source, select: refSelect })
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

export default withAuth(handler, { roles: ['admin', 'source'] });
