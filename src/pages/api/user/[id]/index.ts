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
import { ALL_ROLES, sendAuthError, withAuth } from 'src/utils/auth';
import { calculateAge } from 'src/utils/age';
import {
  accountOf,
  assertInternAccess,
  internSelectFor,
  refSelectFor,
} from 'src/utils/internScope';

// ----------------------------------------------------------------------
// Hồ sơ một TTS. Mọi role gọi được (trang hồ sơ không có RoleBasedGuard), nhưng chỉ TTS trong
// phạm vi tài khoản; đối tác không nhận giấy tờ / liên lạc / hợp đồng — xem internScope.ts.

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const account = accountOf(req);
    await assertInternAccess(account, req.query.id);

    const refSelect = refSelectFor(account);
    const intern: any = await Intern.findById(req.query.id)
      .select(internSelectFor(account))
      .populate({ path: 'tradeUnion', model: TradeUnion, select: refSelect })
      .populate({ path: 'companySelect', model: Company, select: refSelect })
      .populate({ path: 'source', model: Source, select: refSelect })
      .lean(); // để object thuần, dễ chỉnh sửa

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    // tính lại tuổi từ birthday
    intern.age = calculateAge(intern.birthday);

    return res.status(200).json({
      intern,
    });
  } catch (error) {
    if (sendAuthError(error, res)) return undefined;
    console.error('[Intern API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : error,
    });
  }
}

export default withAuth(handler, { roles: ALL_ROLES });
