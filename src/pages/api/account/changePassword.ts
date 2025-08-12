import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import Account from 'src/models/account';
import cors from 'src/utils/cors';
import db from 'src/utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { username, oldPassword, newPassword } = req.body;

    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    // Tìm tài khoản theo username
    const user = await Account.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('[Change Password API Error]:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
