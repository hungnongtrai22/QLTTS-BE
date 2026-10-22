import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from 'src/utils/auth';
import db from 'src/utils/db';
import { findInternBasics, internBasics } from 'src/utils/studyMonth';

// ----------------------------------------------------------------------
// TTS có thể xếp vào lớp (hộp thoại "Thêm TTS" ở trang Lớp; chỉ admin, chỉ đọc): mọi TTS đang
// học (status 'study'), kèm lớp hiện tại để FE báo "đang ở lớp khác".
// TTS ở trạng thái khác vẫn xếp lớp được từ thanh chọn nhiều dòng ở danh sách TTS.
// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const interns = await findInternBasics({ status: 'study' });

    return res.status(200).json({ interns: interns.map(internBasics) });
  } catch (error) {
    console.error('[Study Class Candidates API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export default withAuth(handler, { roles: ['admin'] });
