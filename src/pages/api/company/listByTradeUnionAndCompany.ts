import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Company from 'src/models/company';
import TradeUnion from 'src/models/tradeUnion';
import db from 'src/utils/db';
import { withAuth } from 'src/utils/auth';
import { REF_NAME_SELECT, accountOf, isAdmin } from 'src/utils/internScope';

// ----------------------------------------------------------------------
// Công ty cho bộ lọc ở trang TTS của nghiệp đoàn. Tài khoản nghiệp đoàn luôn nhận đúng nghiệp
// đoàn (và công ty được xem) của mình, và chỉ tên công ty.

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const account: any = accountOf(req);
    const admin = isAdmin(account);
    const { tradeUnion, companySelect } = admin
      ? req.body
      : { tradeUnion: account.tradeUnion, companySelect: account.companySelect };

    if (!admin && !tradeUnion) {
      return res.status(200).json({ companies: [] });
    }

    const query: any = {};

    if (tradeUnion) {
      query.tradeUnion = tradeUnion;
    }

    // Nếu gửi vào mảng id công ty thì lọc theo mảng đó
    if (companySelect && Array.isArray(companySelect) && companySelect.length > 0) {
      query._id = { $in: companySelect };
    }

    const companies = await Company.find(query)
      .select(admin ? '' : `${REF_NAME_SELECT} tradeUnion`)
      .populate({ path: 'tradeUnion', model: TradeUnion, select: admin ? '' : REF_NAME_SELECT });

    return res.status(200).json({ companies });
  } catch (error) {
    console.error('[Company API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}

export default withAuth(handler, { roles: ['admin', 'tradeunion'] });
