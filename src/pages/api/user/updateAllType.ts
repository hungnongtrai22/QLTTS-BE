import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';
// _mock
import Intern from 'src/models/intern';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    // Lấy type muốn cập nhật từ body (mặc định là 'intern' nếu không truyền)
    const { type = 'intern' } = req.body;

    // Cập nhật tất cả intern chưa có field "type" hoặc type bị null/rỗng
    const result = await Intern.updateMany(
      { $or: [{ type: { $exists: false } }, { type: null }, { type: '' }] },
      { $set: { type } }
    );

    return res.status(200).json({
      message: 'Cập nhật type cho tất cả intern thành công',
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      type,
    });
  } catch (error) {
    console.error('[Update All Intern Type API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
