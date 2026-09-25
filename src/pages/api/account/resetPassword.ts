import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
// models
import Account from 'src/models/account';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';
import { requireRole, sendAuthError } from 'src/utils/auth';

// ----------------------------------------------------------------------
// Admin đặt lại mật khẩu cho một tài khoản, không cần biết mật khẩu cũ.
// Người dùng tự đổi mật khẩu của mình thì dùng /api/account/changePassword.
// ----------------------------------------------------------------------

const MIN_PASSWORD_LENGTH = 8;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireRole(req, ['admin']);

    await db.connectDB();

    const { _id, newPassword } = req.body;

    if (!_id || !newPassword) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    if (`${newPassword}`.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
    }

    const target = await Account.findById(_id);

    if (!target) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    target.password = await bcrypt.hash(newPassword, 10);
    await target.save();

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    if (sendAuthError(error, res)) {
      return undefined;
    }

    console.error('[Reset Password API]: ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
