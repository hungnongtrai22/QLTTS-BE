import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Attendance from 'src/models/attendance';
// _mock
import db from '../../../utils/db';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const { internId, attendItem, month, year } = req.body;

    if (
      typeof internId !== 'string' ||
      typeof month !== 'number' ||
      typeof year !== 'number' ||
      !attendItem
    ) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }

    // Kiểm tra bản ghi đã tồn tại chưa
    const existingRecord = await Attendance.findOne({ internId, month, year });

    let updatedAttendance;

    if (existingRecord) {
      // Nếu đã tồn tại, thêm attendItem vào mảng attend
      updatedAttendance = await Attendance.findOneAndUpdate(
        { internId, month, year },
        { $push: { attend: attendItem } },
        { new: true }
      );
    } else {
      // Nếu chưa có thì tạo mới với attend là mảng chứa 1 phần tử
      updatedAttendance = await new Attendance({
        internId,
        month,
        year,
        attend: [attendItem],
      }).save();
    }

    return res.status(200).json({
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error('[Attendance API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
    });
  }
}
