import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';
import Study from 'src/models/study';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    // chỉ cho phép phương thức PUT để cập nhật
    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // cập nhật tất cả document chưa có isPublic hoặc isPublic = null
    const result = await Study.updateMany(
      { $or: [{ isPublic: { $exists: false } }, { isPublic: null }] },
      { $set: { isPublic: true } }
    );

    return res.status(200).json({
      message: 'Đã cập nhật thành công tất cả bản ghi Study có thêm isPublic = true',
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    });
  } catch (error) {
    console.error('[Update Study isPublic API]:', error);
    return res.status(500).json({
      message: 'Đã xảy ra lỗi khi cập nhật dữ liệu',
      error: error.message,
    });
  }
}
