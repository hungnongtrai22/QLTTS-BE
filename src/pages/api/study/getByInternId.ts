import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Study from 'src/models/study';
import db from 'src/utils/db';
import { sendAuthError, withAuth } from 'src/utils/auth';
import { accountOf, assertInternAccess } from 'src/utils/internScope';

// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    // Chỉ TTS trong phạm vi tài khoản (xem src/utils/internScope.ts).
    await assertInternAccess(accountOf(req), req.body.internId);

    const study = await Study.findOne({
      internId: req.body.internId,
    }).sort({ time: -1 });

    return res.status(200).json({
      study,
    });
  } catch (error) {
    if (sendAuthError(error, res)) return undefined;
    console.error('[Study API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}

export default withAuth(handler, { roles: ['admin', 'source'] });
