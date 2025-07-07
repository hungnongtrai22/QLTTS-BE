import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import Attendance from 'src/models/attendance';
import db from 'src/utils/db';

const HOLIDAYS_2025 = [
  {
    title: '元旦', // Tết Dương lịch
    start: '2025-01-01T01:00:00.000+00:00',
    end: '2025-01-01T10:00:00.000+00:00',
  },
  {
    title: 'テト（旧正月）', // Tết Nguyên đán
    start: '2025-01-28T01:00:00.000+00:00',
    end: '2025-02-02T10:00:00.000+00:00',
  },
  {
    title: 'フン王の命日', // Giỗ tổ Hùng Vương
    start: '2025-03-31T01:00:00.000+00:00',
    end: '2025-03-31T10:00:00.000+00:00',
  },
  {
    title: '南部解放記念日', // Giải phóng miền Nam
    start: '2025-04-30T01:00:00.000+00:00',
    end: '2025-04-30T10:00:00.000+00:00',
  },
  {
    title: 'メーデー', // Quốc tế Lao động
    start: '2025-05-01T01:00:00.000+00:00',
    end: '2025-05-01T10:00:00.000+00:00',
  },
  {
    title: '建国記念日', // Quốc khánh
    start: '2025-09-02T01:00:00.000+00:00',
    end: '2025-09-03T10:00:00.000+00:00',
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const { internId } = req.body;

    if (!internId) {
      return res.status(400).json({ message: 'Thiếu internId' });
    }

    const attendItems = HOLIDAYS_2025.map((holiday) => {
      const start = new Date(holiday.start);
      const end = new Date(holiday.end);

      return {
        title: holiday.title,
        color: '#FF5630',
        allDay: false,
        off: true,
        start,
        end,
      };
    });

    // Gộp các attend theo month/year
    const grouped = new Map<string, { month: number; year: number; items: any[] }>();

    attendItems.forEach((item) => {
      const date = new Date(item.start);
      const month = date.getMonth() + 1; // 0-indexed
      const year = date.getFullYear();
      const key = `${year}-${month}`;

      if (!grouped.has(key)) {
        grouped.set(key, { month, year, items: [] });
      }

      grouped.get(key)!.items.push(item);
    });

    const insertedRecords = [];

    for (const { month, year, items } of grouped.values()) {
      const existing = await Attendance.findOne({ internId, month, year });

      let updated;

      if (existing) {
        updated = await Attendance.findOneAndUpdate(
          { internId, month, year },
          { $push: { attend: { $each: items } } },
          { new: true }
        );
      } else {
        updated = await new Attendance({
          internId,
          month,
          year,
          attend: items,
        }).save();
      }

      insertedRecords.push(updated);
    }

    return res.status(200).json({
      message: 'Đã thêm ngày nghỉ lễ 2025',
      data: insertedRecords,
    });
  } catch (error) {
    console.error('[Add Holidays 2025]', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
}
