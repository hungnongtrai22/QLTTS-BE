import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import 'src/models/intern'; // đảm bảo model Intern được đăng ký trước
import Compare from 'src/models/compare';
import db from 'src/utils/db';
import { ALL_ROLES, withAuth } from 'src/utils/auth';
import { withListInternAges } from 'src/utils/age';
import { accountOf, internScope, internSelectFor, isAdmin } from 'src/utils/internScope';

// ----------------------------------------------------------------------
// Danh sách so sánh của một tài khoản. Đối tác luôn nhận danh sách của chính mình
// (accountId gửi lên bị bỏ qua), chỉ gồm TTS còn trong phạm vi và không kèm giấy tờ / liên lạc.

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const account = accountOf(req);
    const admin = isAdmin(account);
    const accountId = admin ? req.body.accountId || account._id : account._id;

    const compare = await Compare.findOne({ account: accountId }).populate({
      path: 'listIntern',
      match: internScope(account) || {},
      select: internSelectFor(account),
    });
    return res.status(200).json({
      compare: withListInternAges(compare),
    });
  } catch (error) {
    console.error('[Comapre API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}

export default withAuth(handler, { roles: ALL_ROLES });
