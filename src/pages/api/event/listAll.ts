import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import Event from 'src/models/event';
import db from 'src/utils/db';

// Hàm tạo danh sách các ngày giữa start và end
function getDatesBetween(start: Date, end: Date): { day: number; month: number; year: number }[] {
  const dates = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push({
      day: current.getDate(),
      month: current.getMonth() + 1, // JS months 0-based
      year: current.getFullYear(),
    });
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const events = await Event.find();

    const groupedMap = new Map<string, { days: number[]; month: number; year: number }>();

    for (const event of events) {
      const { attend } = event;

      if (!Array.isArray(attend)) continue;

      attend.forEach((a) => {
        if (a?.start && a?.end) {
          const start = new Date(a.start);
          const end = new Date(a.end);

          const datesInRange = getDatesBetween(start, end);

          datesInRange.forEach(({ day, month, year }) => {
            const key = `${month}-${year}`;
            if (!groupedMap.has(key)) {
              groupedMap.set(key, { days: [day], month, year });
            } else {
              const group = groupedMap.get(key)!;
              group.days.push(day);
            }
          });
        }
      });
    }

    // Xử lý xóa trùng lặp ngày trong từng nhóm
    const result = Array.from(groupedMap.values()).map((item) => ({
      ...item,
      days: Array.from(new Set(item.days)).sort((a, b) => a - b),
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('[Event API - Range Days]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
