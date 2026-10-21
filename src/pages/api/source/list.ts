import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Source from 'src/models/source';
import db from 'src/utils/db';
import { withAuth } from 'src/utils/auth';
import { REF_NAME_SELECT, accountOf, isAdmin } from 'src/utils/internScope';

// ----------------------------------------------------------------------
// Danh sách nguồn. Demo chỉ dùng tên để đổ bộ lọc ở trang danh sách TTS.

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const sources = await Source.find().select(isAdmin(accountOf(req)) ? '' : REF_NAME_SELECT);
    return res.status(200).json({
      sources,
    });
  } catch (error) {
    console.error('[Source API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}

export default withAuth(handler, { roles: ['admin', 'demo'] });
