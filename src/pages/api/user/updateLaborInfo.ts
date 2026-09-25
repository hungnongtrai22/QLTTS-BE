import { NextApiRequest, NextApiResponse } from 'next';
// utils
import { withAuth } from 'src/utils/auth';
import db from '../../../utils/db';
import Intern from '../../../models/intern';

// ----------------------------------------------------------------------
// Lưu form "Hồ sơ xuất cảnh" trên trang hồ sơ TTS (giấy tờ, liên hệ, hợp đồng).
//
// Trước đây form này gửi tới `updateTradeUnion`, vốn chỉ lưu nghiệp đoàn/công ty/các
// ngày, nên CCCD, hộ chiếu, số hợp đồng... người dùng gõ vào đều bị bỏ đi âm thầm.
//
// Chỉ động tới các khoá có mặt trong body: khoá vắng mặt giữ nguyên giá trị cũ,
// khoá gửi lên rỗng ('' hoặc null) thì $unset thay vì lưu chuỗi rỗng.
// Cố ý KHÔNG nhận tradeUnion/companySelect/source/status: các trường đó do form
// khác trên cùng trang quản lý, nhận ở đây sẽ ghi đè bằng giá trị cũ của form này.
// ----------------------------------------------------------------------

const TEXT_FIELDS = [
  'field',
  'citizenId',
  'citizenPlace',
  'passportId',
  'reff',
  'street',
  'state',
  'postelCode',
  'country',
  'phone',
  'emergencyContactName',
  'emergencyContactRelationship',
  'emergencyContactPhone',
  'contractId',
  'contractPeriod',
  'contractResult',
  'profileStatus',
] as const;

const DATE_FIELDS = ['citizenDate', 'passportDate', 'contractDate'] as const;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { _id } = req.body || {};

    if (!_id) {
      return res.status(400).json({ message: 'Missing intern ID (_id)' });
    }

    const $set: Record<string, unknown> = {};
    const $unset: Record<string, 1> = {};

    TEXT_FIELDS.forEach((key) => {
      if (!(key in req.body)) return;
      const value = req.body[key];
      const text = typeof value === 'string' ? value.trim() : value;
      if (text === '' || text === null || text === undefined) {
        $unset[key] = 1;
      } else {
        $set[key] = String(text);
      }
    });

    for (let i = 0; i < DATE_FIELDS.length; i += 1) {
      const key = DATE_FIELDS[i];
      if (key in req.body) {
        const value = req.body[key];
        if (value === '' || value === null || value === undefined) {
          $unset[key] = 1;
        } else {
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) {
            return res.status(400).json({ message: `Invalid date for ${key}` });
          }
          $set[key] = date;
        }
      }
    }

    const update: Record<string, unknown> = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($unset).length) update.$unset = $unset;

    await db.connectDB();

    const updatedIntern = Object.keys(update).length
      ? await Intern.findByIdAndUpdate(_id, update, { new: true })
      : await Intern.findById(_id);

    if (!updatedIntern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    return res.status(200).json({ intern: updatedIntern });
  } catch (error) {
    console.error('[Update Labor Info API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// Chỉ admin: form gọi endpoint này nằm trong tab "Thông tin khác" của trang hồ sơ,
// tab đó chỉ render khi user.role === 'admin' (intern-profile-view.tsx).
export default withAuth(handler, { roles: ['admin'] });
