import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import TradeUnion from 'src/models/tradeUnion';
import db from 'src/utils/db';
import { withAuth } from 'src/utils/auth';
import { REF_NAME_SELECT, accountOf, isAdmin } from 'src/utils/internScope';

// ----------------------------------------------------------------------
// Danh sách nghiệp đoàn. Nguồn / demo / Đồng Tháp chỉ dùng tên để đổ bộ lọc.

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const tradeUnions = await TradeUnion.find().select(
      isAdmin(accountOf(req)) ? '' : REF_NAME_SELECT
    );
    return res.status(200).json({
      tradeUnions,
    });
  } catch (error) {
    console.error('[Product API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}

export default withAuth(handler, { roles: ['admin', 'source', 'demo', 'dongthap'] });
