import { NextApiRequest, NextApiResponse } from 'next';
// models
import Account from 'src/models/account';
import TradeUnion from 'src/models/tradeUnion';
import Company from 'src/models/company';
import Source from 'src/models/source';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';
import { requireRole, sendAuthError } from 'src/utils/auth';

// ----------------------------------------------------------------------
// Danh sách tài khoản. Chỉ admin.
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireRole(req, ['admin']);

    await db.connectDB();

    const accounts = await Account.find()
      // -password là bắt buộc: đây là hash bcrypt, không có lý do gì để rời khỏi server.
      .select('-password')
      .populate({ path: 'tradeUnion', model: TradeUnion, select: 'name' })
      .populate({ path: 'companySelect', model: Company, select: 'name' })
      .populate({ path: 'source', model: Source, select: 'name' })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ accounts });
  } catch (error) {
    if (sendAuthError(error, res)) {
      return undefined;
    }

    console.error('[Account List API]: ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
