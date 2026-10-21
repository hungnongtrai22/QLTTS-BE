import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Gallery from 'src/models/gallery';

import db from 'src/utils/db';
import { ALL_ROLES, sendAuthError, withAuth } from 'src/utils/auth';
import { accountOf, assertInternAccess, isAdmin } from 'src/utils/internScope';

// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const { internId, status } = req.query;
    const account = accountOf(req);

    // Đối tác: bắt buộc một TTS trong phạm vi, và chỉ nhận album của TTS đó + album chung.
    // Trước đây không truyền internId (hoặc truyền status) là lấy được album của mọi TTS.
    if (!isAdmin(account)) {
      await assertInternAccess(account, internId);
      const galleries = await Gallery.find({ $or: [{ internId }, { status: 'Tất cả' }] }).sort({
        postedAt: -1,
      });
      return res.status(200).json({ galleries });
    }

    let filter: any = {};

    // Nếu có internId => lấy gallery của intern đó + gallery có status = "Tất cả"
    if (internId && internId !== 'Tất cả') {
      filter = {
        $or: [{ internId }, { status: 'Tất cả' }],
      };
    }

    // Nếu có status riêng mà khác "Tất cả" => ghi đè filter
    if (status && status !== 'Tất cả') {
      filter = { status };
    }

    const galleries = await Gallery.find(filter).sort({ postedAt: -1 });

    return res.status(200).json({
      galleries,
    });
  } catch (error) {
    if (sendAuthError(error, res)) return undefined;
    console.error('[Gallery API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : error,
    });
  }
}

export default withAuth(handler, { roles: ALL_ROLES });
