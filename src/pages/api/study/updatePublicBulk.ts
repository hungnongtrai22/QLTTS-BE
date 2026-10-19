import { NextApiRequest, NextApiResponse } from 'next';
import { isValidObjectId } from 'mongoose';
import Study from 'src/models/study';
import { withAuth } from 'src/utils/auth';
import db from 'src/utils/db';

// ----------------------------------------------------------------------
// Công khai / thu hồi công khai nhiều báo cáo học tập một lần (trang "Báo cáo học tập", chỉ
// admin).
//
//   PUT { ids: string[] (id báo cáo), isPublic: boolean }
//
// Chỉ đổi đúng trường isPublic, không đụng nội dung báo cáo. Công khai rồi thì báo cáo bị khóa
// sửa ở mọi nơi cho tới khi "Mở khóa để sửa" (xem src/utils/studyLock.ts).
// Tên bắt đầu bằng "update" nên chế độ READ_ONLY tự chặn.
// ----------------------------------------------------------------------

const MAX_IDS = 500;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { ids, isPublic } = req.body || {};

    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ message: 'isPublic phải là true hoặc false' });
    }
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_IDS) {
      return res.status(400).json({ message: `ids phải có từ 1 đến ${MAX_IDS} báo cáo` });
    }
    const unique = Array.from(new Set(ids.map(String)));
    if (unique.some((id) => !isValidObjectId(id))) {
      return res.status(400).json({ message: 'Có id báo cáo không hợp lệ' });
    }

    await db.connectDB();

    const result = await Study.updateMany({ _id: { $in: unique } }, { $set: { isPublic } });

    return res.status(200).json({
      requested: unique.length,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error('[Study Update Public Bulk API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// Chỉ admin: cùng quyền với trang Báo cáo học tập.
export default withAuth(handler, { roles: ['admin'] });
