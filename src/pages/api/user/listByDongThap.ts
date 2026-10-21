/* eslint-disable no-plusplus */

import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Intern from 'src/models/intern';
import db from 'src/utils/db';
import TradeUnion from 'src/models/tradeUnion';
import Company from 'src/models/company';
import { withAuth } from 'src/utils/auth';
import { calculateAge } from 'src/utils/age';
import {
  DONG_THAP_REGEX,
  PARTNER_LIST_SELECT,
  REF_NAME_SELECT,
  accountOf,
  isAdmin,
} from 'src/utils/internScope';

// ----------------------------------------------------------------------
// TTS có địa chỉ ở Đồng Tháp. Tài khoản Đồng Tháp chỉ nhận các trường của bảng danh sách.

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const admin = isAdmin(accountOf(req));
    const refSelect = admin ? '' : REF_NAME_SELECT;

    const interns = await Intern.find({
      $or: [{ address: { $regex: DONG_THAP_REGEX } }, { city: { $regex: DONG_THAP_REGEX } }],
    })
      .select(admin ? '' : PARTNER_LIST_SELECT)
      .populate({ path: 'tradeUnion', model: TradeUnion, select: refSelect })
      .populate({ path: 'companySelect', model: Company, select: refSelect })
      .lean();

    const internsWithAge = interns.map((intern) => ({
      ...intern,
      age: calculateAge(intern.birthday as Date),
    }));

    res.status(200).json({ interns: internsWithAge });
  } catch (error) {
    console.error('[Intern API]: ', error);
    res.status(400).json({ message: error instanceof Error ? error.message : error });
  }
}

export default withAuth(handler, { roles: ['admin', 'dongthap'] });
