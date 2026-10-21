import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Gallery from 'src/models/gallery';
import db from 'src/utils/db';
import Intern from 'src/models/intern';
import { ALL_ROLES, sendAuthError, withAuth } from 'src/utils/auth';
import { accountOf, assertInternAccess, internSelectFor, isAdmin } from 'src/utils/internScope';

// ----------------------------------------------------------------------
// Chi tiết một album (trang "Xem chi tiết" từ tab Album của hồ sơ TTS).
// Đối tác chỉ xem album chung ("Tất cả") hoặc album của TTS trong phạm vi tài khoản.

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const account = accountOf(req);

    if (!isAdmin(account)) {
      const meta: any = await Gallery.findById(req.query.id).select('internId status').lean();
      if (!meta) {
        return res.status(404).json({ message: 'Gallery not found' });
      }
      if (meta.status !== 'Tất cả') {
        await assertInternAccess(account, meta.internId);
      }
    }

    const gallery = await Gallery.findById(req.query.id).populate({
      path: 'internId',
      model: Intern,
      select: internSelectFor(account),
    });
    return res.status(200).json({
      gallery,
    });
  } catch (error) {
    if (sendAuthError(error, res)) return undefined;
    console.error('[Gallery API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}

export default withAuth(handler, { roles: ALL_ROLES });
