import { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/utils/db';
import cors from 'src/utils/cors';
import Attendance from 'src/models/attendance';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const { internId, monthAndYear } = req.body;

    if (!internId || !monthAndYear) {
      return res.status(400).json({ message: 'Thiếu internId hoặc monthAndYear' });
    }

    const date = new Date(monthAndYear);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // từ 1 đến 12

    // Tổng số ngày trong tháng (Thứ 2 → Thứ 6)
    const daysInMonth = new Date(year, month, 0).getDate(); // Lưu ý: truyền ngày 0 để lấy ngày cuối của tháng trước
    const weekdays: Date[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month - 1, d);
      const weekday = day.getDay();
      if (weekday !== 0 && weekday !== 6) weekdays.push(day);
    }

    let totalSessions = weekdays.length;
    let removedDatesSet = new Set<string>();
    let manualOffSessions = 0;

    const record = await Attendance.findOne({ internId, month, year });

    if (record) {
      for (const item of record.attend) {
        const isHoliday = item.color === '#FF5630';

        if (isHoliday) {
          const start = new Date(item.start);
          const end = new Date(item.end);

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const current = new Date(d);
            if (current.getMonth() + 1 !== month) continue;

            const dayStr = current.toDateString();
            if (
              !removedDatesSet.has(dayStr) &&
              current.getDay() !== 0 &&
              current.getDay() !== 6
            ) {
              removedDatesSet.add(dayStr);
              totalSessions -= 1;
            }
          }
        } else {
          // nghỉ thủ công: am / pm / allDay
          if (item.allDay) {
            manualOffSessions += 1;
          } else {
            if (item.am) manualOffSessions += 0.5;
            if (item.pm) manualOffSessions += 0.5;
          }
        }
      }
    }

    const actualAttendedSessions = totalSessions - manualOffSessions;

    return res.status(200).json({
      internId,
      month,
      year,
      totalSessions,             // Buổi học lý thuyết (T2 → T6, trừ ngày lễ)
      manualOffSessions,         // Số buổi nghỉ có đánh dấu allDay/am/pm
      attendedDays: actualAttendedSessions, // Số buổi đi học thực tế
      removedDates: Array.from(removedDatesSet),
    });
  } catch (err) {
    console.error('[Attendance Statistics]', err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}
