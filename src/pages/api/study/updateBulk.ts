import { NextApiRequest, NextApiResponse } from 'next';
import { isValidObjectId } from 'mongoose';
import Study from 'src/models/study';
import Intern from 'src/models/intern';
import { withAuth } from 'src/utils/auth';
import db from 'src/utils/db';
import { byIntern, parseStudyMonth } from 'src/utils/studyMonth';

// ----------------------------------------------------------------------
// Lưu nhiều báo cáo học tập của một tháng một lần (trang "Nhập điểm hàng loạt", chỉ admin).
//
//   PUT { month: 'YYYY-MM', publish: boolean, reports: [{ internId, health … speak, level,
//         kanji?, grammarAndReading?, listeningComprehension?, learningProcess,
//         characteristic, teacher?, comment }] }
//
// Quy tắc (chủ dự án chọn "đủ mới lưu"): mỗi báo cáo phải đủ như form nhập điểm — 10 điểm,
// trình độ, tiến độ, tính cách, nhận xét. Server kiểm tra lại toàn bộ, không tin trình duyệt.
//
// - Tháng đó TTS đã có báo cáo → cập nhật đúng báo cáo đó ($set, giữ nguyên tháng học).
//   Chưa có → tạo mới, tháng học = báo cáo gần nhất trước đó + 1 (cùng cách tính với form).
// - Tổng và trung bình do server tính.
// - publish: true → bật công khai cho các báo cáo lưu được; false → giữ nguyên trạng thái
//   công khai cũ (báo cáo mới thì chưa công khai).
// - Không xóa gì. Mỗi báo cáo lỗi được báo riêng, các báo cáo khác vẫn lưu.
// ----------------------------------------------------------------------

const SCORE_KEYS = [
  'health',
  'cooperation',
  'attend',
  'discipline',
  'attitude',
  'acquiringKnowledge',
  'write',
  'read',
  'listen',
  'speak',
] as const;

const JLPT_KEYS = ['kanji', 'grammarAndReading', 'listeningComprehension'] as const;

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

const MAX_REPORTS = 200;

const COMMENT_MAX = 300;

// Nhận xét là HTML của trình soạn thảo; giới hạn tính trên phần chữ. FE đếm y hệt.
export const commentText = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&(amp|lt|gt|quot|#39);/g, '_')
    .trim();

type Checked =
  | { message: string }
  | { doc: Record<string, unknown>; unset: string[]; teacher: string };

export function checkReport(input: any): Checked {
  const doc: Record<string, unknown> = {};

  for (let i = 0; i < SCORE_KEYS.length; i += 1) {
    const key = SCORE_KEYS[i];
    const value = input[key];
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      return { message: `${key}: điểm phải là số nguyên từ 0 đến 100` };
    }
    doc[key] = value;
  }

  if ((doc.read as number) % 10 !== 0) {
    return { message: 'read: Đọc hiểu phải chia hết cho 10' };
  }

  // Thi thử JLPT không bắt buộc; để trống thì xóa giá trị cũ (nếu có).
  const unset: string[] = [];
  for (let i = 0; i < JLPT_KEYS.length; i += 1) {
    const key = JLPT_KEYS[i];
    const value = input[key];
    if (value === null || value === undefined || value === '') {
      unset.push(key);
    } else if (!Number.isInteger(value) || value < 0 || value > 60) {
      return { message: `${key}: điểm phải là số nguyên từ 0 đến 60` };
    } else {
      doc[key] = value;
    }
  }

  if (!LEVELS.includes(input.level)) {
    return { message: 'level: trình độ phải là N5–N1' };
  }
  doc.level = input.level;

  const learningProcess =
    typeof input.learningProcess === 'string' ? input.learningProcess.trim() : '';
  const characteristic =
    typeof input.characteristic === 'string' ? input.characteristic.trim() : '';
  if (!learningProcess) return { message: 'learningProcess: tiến độ học tập không được để trống' };
  if (!characteristic) return { message: 'characteristic: tính cách không được để trống' };
  if (learningProcess.length > 200 || characteristic.length > 200) {
    return { message: 'Tiến độ / tính cách quá dài' };
  }
  doc.learningProcess = learningProcess;
  doc.characteristic = characteristic;

  const comment = typeof input.comment === 'string' ? input.comment : '';
  const text = commentText(comment);
  if (!text) return { message: 'comment: nhận xét không được để trống' };
  if (text.length > COMMENT_MAX) {
    return { message: `comment: nhận xét tối đa ${COMMENT_MAX} ký tự` };
  }
  doc.comment = comment;

  const teacher = typeof input.teacher === 'string' ? input.teacher.trim().slice(0, 100) : '';

  const scores = SCORE_KEYS.map((key) => doc[key] as number);
  doc.total = scores.reduce((a, b) => a + b, 0);
  doc.average =
    ((doc.write as number) +
      (doc.read as number) +
      (doc.listen as number) +
      (doc.speak as number)) /
    4;

  return { doc, unset, teacher };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { month: monthParam, reports, publish } = req.body || {};
    const month = parseStudyMonth(monthParam);

    if (!month) {
      return res.status(400).json({ message: 'month phải có dạng YYYY-MM' });
    }
    if (!Array.isArray(reports) || reports.length === 0 || reports.length > MAX_REPORTS) {
      return res.status(400).json({ message: `reports phải có từ 1 đến ${MAX_REPORTS} báo cáo` });
    }

    const ids = reports.map((item: any) => String(item?.internId || ''));
    if (ids.some((id) => !isValidObjectId(id))) {
      return res.status(400).json({ message: 'Có internId không hợp lệ' });
    }
    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({ message: 'Một TTS xuất hiện hai lần trong cùng lần lưu' });
    }

    await db.connectDB();

    const [interns, currentReports, priorReports] = await Promise.all([
      Intern.find({ _id: { $in: ids } })
        .select('_id')
        .lean(),
      Study.find({ internId: { $in: ids }, monthAndYear: { $gte: month.start, $lt: month.end } })
        .select('_id internId updatedAt')
        .sort({ updatedAt: 1 })
        .lean(),
      Study.find({ internId: { $in: ids }, monthAndYear: { $lt: month.start } })
        .select('internId time')
        .sort({ monthAndYear: -1 })
        .lean(),
    ]);

    const knownInterns = new Set(interns.map((intern: any) => String(intern._id)));
    const currentByIntern = byIntern(currentReports);
    const lastTimeByIntern = new Map<string, number>();
    priorReports.forEach((report: any) => {
      const id = String(report.internId);
      if (!lastTimeByIntern.has(id)) lastTimeByIntern.set(id, Number(report.time) || 0);
    });

    const results: Array<Record<string, unknown>> = [];

    // Lưu tuần tự: tối đa vài trăm báo cáo, mỗi báo cáo một lệnh — đơn giản và dễ báo lỗi
    // đúng dòng.
    for (let i = 0; i < reports.length; i += 1) {
      const input = reports[i];
      const internId = ids[i];
      const checked = checkReport(input);

      if ('message' in checked) {
        results.push({ internId, ok: false, message: checked.message });
      } else if (!knownInterns.has(internId)) {
        results.push({ internId, ok: false, message: 'Không tìm thấy thực tập sinh' });
      } else {
        try {
          const current: any = currentByIntern.get(internId);
          const fields: Record<string, unknown> = { ...checked.doc };
          if (checked.teacher) fields.teacher = checked.teacher;

          if (current) {
            if (publish === true) fields.isPublic = true;
            const update: Record<string, unknown> = { $set: fields };
            if (checked.unset.length) {
              update.$unset = Object.fromEntries(checked.unset.map((key) => [key, '']));
            }
            // eslint-disable-next-line no-await-in-loop
            await Study.updateOne({ _id: current._id }, update, { runValidators: true });
            results.push({ internId, ok: true, created: false, reportId: String(current._id) });
          } else {
            // eslint-disable-next-line no-await-in-loop
            const created = await Study.create({
              ...fields,
              internId,
              monthAndYear: month.start,
              time: (lastTimeByIntern.get(internId) || 0) + 1,
              isPublic: publish === true,
            });
            results.push({ internId, ok: true, created: true, reportId: String(created._id) });
          }
        } catch (error) {
          results.push({
            internId,
            ok: false,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    const saved = results.filter((item) => item.ok).length;

    return res.status(200).json({
      month: month.key,
      saved,
      failed: results.length - saved,
      results,
    });
  } catch (error) {
    console.error('[Study Update Bulk API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// Chỉ admin: cùng quyền với trang Báo cáo học tập. Tên bắt đầu bằng "update" nên chế độ
// READ_ONLY tự chặn.
export default withAuth(handler, { roles: ['admin'] });
