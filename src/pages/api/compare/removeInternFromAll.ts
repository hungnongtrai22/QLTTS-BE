// pages/api/compare/remove-intern.ts
import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Compare from 'src/models/compare';
import { ALL_ROLES, withAuth } from 'src/utils/auth';
import { accountOf, isAdmin } from 'src/utils/internScope';
import db from '../../../utils/db';

// ----------------------------------------------------------------------
// Gỡ một TTS khỏi danh sách so sánh. Đối tác chỉ sửa được danh sách của chính mình.

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { compareId, internId } = req.body;

    if (!compareId || !internId) {
      return res.status(400).json({ message: 'Missing compareId or internId' });
    }

    const account = accountOf(req);
    const filter = isAdmin(account) ? { _id: compareId } : { _id: compareId, account: account._id };

    const result = await Compare.findOneAndUpdate(
      filter,
      { $pull: { listIntern: internId } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'Compare not found' });
    }

    return res.status(200).json({
      message: `Removed internId ${internId} from compare ${compareId}`,
      data: result,
    });
  } catch (error) {
    console.error('[Remove Intern from Compare API]: ', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export default withAuth(handler, { roles: ALL_ROLES });
