import { NextApiRequest, NextApiResponse } from 'next';
// models
import Account from 'src/models/account';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';
import { requireRole, sendAuthError } from 'src/utils/auth';

// ----------------------------------------------------------------------
// Xoá tài khoản. Chỉ admin.
// Không đụng tới dữ liệu thực tập sinh — chỉ xoá bản ghi đăng nhập.
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const currentAccount = await requireRole(req, ['admin']);

    await db.connectDB();

    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing account ID (_id)' });
    }

    if (`${_id}` === `${currentAccount._id}`) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    const target = await Account.findById(_id);

    if (!target) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    // Giữ lại ít nhất một admin: mất hết admin là mất đường tạo tài khoản mới.
    if (target.role === 'admin') {
      const adminCount = await Account.countDocuments({ role: 'admin' });

      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin account.' });
      }
    }

    await Account.findByIdAndDelete(_id);

    return res.status(200).json({ message: 'Account deleted successfully.' });
  } catch (error) {
    if (sendAuthError(error, res)) {
      return undefined;
    }

    console.error('[Account Delete API]: ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
