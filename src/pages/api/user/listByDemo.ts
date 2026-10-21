/* eslint-disable no-plusplus */

import { NextApiRequest, NextApiResponse } from 'next';

// utils
import cors from 'src/utils/cors';

import Intern from 'src/models/intern';
import db from 'src/utils/db';

import TradeUnion from 'src/models/tradeUnion';
import Company from 'src/models/company';
import Source from 'src/models/source';
import { withAuth } from 'src/utils/auth';
import { calculateAge } from 'src/utils/age';
import { PARTNER_HIDDEN_SELECT, REF_NAME_SELECT, accountOf, isAdmin } from 'src/utils/internScope';

// ----------------------------------------------------------------------
// Danh sách TTS gán sẵn cho tài khoản demo (account.internsDemo).
//
// Tài khoản demo luôn nhận đúng danh sách của mình — danh sách gửi lên bị bỏ qua. Demo dùng
// chung trang danh sách và các nút xuất Excel/PDF với admin, nên giữ trường của CV và chỉ bỏ
// giấy tờ / liên lạc / hợp đồng.

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const account = accountOf(req);
    const admin = isAdmin(account);
    const internsDemo = admin ? req.body.internsDemo : account.internsDemo || [];

    if (!Array.isArray(internsDemo)) {
      return res.status(400).json({
        message: 'internsDemo must be an array',
      });
    }

    const refSelect = admin ? '' : REF_NAME_SELECT;

    const interns = await Intern.find({
      _id: { $in: internsDemo },
    })
      .select(admin ? '' : PARTNER_HIDDEN_SELECT)
      .populate({ path: 'tradeUnion', model: TradeUnion, select: refSelect })
      .populate({ path: 'companySelect', model: Company, select: refSelect })
      .populate({ path: 'source', model: Source, select: refSelect })
      .lean();

    const internsWithAge = interns.map((intern) => ({
      ...intern,
      age: calculateAge(intern.birthday as Date),
    }));

    return res.status(200).json({
      interns: internsWithAge,
    });
  } catch (error) {
    console.error('[Intern API]: ', error);

    return res.status(400).json({
      message: error instanceof Error ? error.message : error,
    });
  }
}

export default withAuth(handler, { roles: ['admin', 'demo'] });
