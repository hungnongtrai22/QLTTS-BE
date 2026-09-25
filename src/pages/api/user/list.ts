/* eslint-disable no-plusplus */

import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';
import { withAuth } from 'src/utils/auth';
import { buildDiacriticInsensitiveRegex } from 'src/utils/search';
// models
import Intern from 'src/models/intern';
import TradeUnion from 'src/models/tradeUnion';
import Company from 'src/models/company';
import Source from 'src/models/source';

// ----------------------------------------------------------------------
// Ba chế độ, chọn bằng query param:
//
//   ?page=0&limit=25   -> phân trang + chỉ lấy trường bảng cần + lọc phía server
//   ?fields=basic      -> chỉ _id/name/namejp, dùng cho dropdown chọn thực tập sinh
//   (không tham số)    -> trả toàn bộ như cũ, giữ tương thích cho export và code cũ
//
// Chế độ mặc định cố tình để nguyên: nó nặng (~1.9MB) nhưng vẫn còn nơi dùng.
// ----------------------------------------------------------------------

// Đúng những trường bảng danh sách và form sửa nhanh cần. Hồ sơ đầy đủ có 110 trường.
const LIST_FIELDS = [
  'name',
  'namejp',
  'avatar',
  'city',
  'birthday',
  'height',
  'weight',
  'createdAt',
  'status',
  'type',
  'departureDate',
  'tradeUnion',
  'companySelect',
  'source',
].join(' ');

// Hàm tính tuổi
function calculateAge(birthday: Date): number {
  if (!birthday) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const m = today.getMonth() - birthday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  return age;
}

const withAge = (interns: any[]) =>
  interns.map((intern) => ({ ...intern, age: calculateAge(intern.birthday as Date) }));

/** Nhận "a,b,c" hoặc mảng, trả về mảng đã bỏ phần tử rỗng. */
function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Bộ lọc trên giao diện dùng TÊN nghiệp đoàn/nguồn/xí nghiệp, còn Intern lưu ObjectId,
 * nên phải tra tên -> id trước khi truy vấn.
 */
async function resolveIdsByName(model: any, names: string[]): Promise<string[]> {
  if (names.length === 0) return [];
  const docs = await model
    .find({ name: { $in: names } })
    .select('_id')
    .lean();
  return docs.map((doc: any) => doc._id);
}

async function buildQuery(req: NextApiRequest) {
  const { search, status, type } = req.query;

  const query: Record<string, any> = {};

  const searchRegex = buildDiacriticInsensitiveRegex(`${search || ''}`);
  if (searchRegex) {
    query.$or = [{ name: searchRegex }, { namejp: searchRegex }];
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  const types = toArray(type);
  if (types.length > 0) {
    query.type = { $in: types };
  }

  const tradeUnionNames = toArray(req.query.tradeUnion);
  const sourceNames = toArray(req.query.source);
  const companyNames = toArray(req.query.company);

  const [tradeUnionIds, sourceIds, companyIds] = await Promise.all([
    resolveIdsByName(TradeUnion, tradeUnionNames),
    resolveIdsByName(Source, sourceNames),
    resolveIdsByName(Company, companyNames),
  ]);

  if (tradeUnionNames.length > 0) query.tradeUnion = { $in: tradeUnionIds };
  if (sourceNames.length > 0) query.source = { $in: sourceIds };
  if (companyNames.length > 0) query.companySelect = { $in: companyIds };

  // Lọc theo năm xuất cảnh: dùng khoảng ngày thay vì $expr/$year để còn dùng được index.
  const years = toArray(req.query.year);
  if (years.length > 0) {
    query.$and = [
      {
        $or: years.map((year) => ({
          departureDate: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lt: new Date(`${Number(year) + 1}-01-01T00:00:00.000Z`),
          },
        })),
      },
    ];
  }

  return query;
}

// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    // --- Chế độ dropdown: chỉ tên, nhẹ nhất có thể ---
    if (req.query.fields === 'basic') {
      const interns = await Intern.find().select('name namejp').sort({ name: 1 }).lean();

      return res.status(200).json({ interns });
    }

    const query = await buildQuery(req);

    // --- Chế độ đầy đủ: không có tham số page ---
    // Không truyền bộ lọc nào thì query rỗng => trả toàn bộ, y hệt hành vi cũ.
    // Có bộ lọc thì vẫn trả đủ 110 trường nhưng chỉ những hồ sơ khớp — đây là
    // đường mà nút xuất Excel và PDF điểm danh dùng, vì chúng cần các trường
    // nằm ngoài projection của bảng.
    if (req.query.page === undefined) {
      const interns = await Intern.find(query)
        .populate({ path: 'tradeUnion', model: TradeUnion })
        .populate({ path: 'companySelect', model: Company })
        .populate({ path: 'source', model: Source })
        .lean();

      return res.status(200).json({ interns: withAge(interns) });
    }

    // --- Chế độ phân trang ---
    const page = Math.max(0, Number(req.query.page) || 0);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 25));
    const requestedSortBy = `${req.query.sortBy || 'createdAt'}`;
    let sortOrder: 1 | -1 = `${req.query.sortOrder}` === 'asc' ? 1 : -1;

    // `age` không được lưu trong CSDL mà tính từ `birthday` lúc trả kết quả,
    // nên sắp xếp theo age phải đổi thành sắp xếp theo birthday với thứ tự ngược lại
    // (sinh sau = trẻ hơn). Nếu không, bấm vào cột Tuổi sẽ không có tác dụng gì.
    let sortBy = requestedSortBy;
    if (requestedSortBy === 'age') {
      sortBy = 'birthday';
      sortOrder = sortOrder === 1 ? -1 : 1;
    }

    // Số đếm cho tab trạng thái tính trên tập đã lọc NHƯNG bỏ qua chính bộ lọc trạng thái —
    // nếu không, tab đang chọn sẽ thành tab duy nhất khác 0.
    const queryWithoutStatus = { ...query };
    delete queryWithoutStatus.status;

    const [interns, total, statusRows] = await Promise.all([
      Intern.find(query)
        .select(LIST_FIELDS)
        .populate({ path: 'tradeUnion', model: TradeUnion, select: 'name' })
        .populate({ path: 'companySelect', model: Company, select: 'name' })
        .populate({ path: 'source', model: Source, select: 'name' })
        .sort({ [sortBy]: sortOrder })
        .skip(page * limit)
        .limit(limit)
        .lean(),
      Intern.countDocuments(query),
      Intern.aggregate([
        { $match: queryWithoutStatus },
        { $group: { _id: '$status', n: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts: Record<string, number> = { all: 0 };
    statusRows.forEach((row: any) => {
      statusCounts[row._id || 'unknown'] = row.n;
      statusCounts.all += row.n;
    });

    return res.status(200).json({
      interns: withAge(interns),
      total,
      page,
      limit,
      statusCounts,
    });
  } catch (error) {
    console.error('[Intern API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : error,
    });
  }
}

export default withAuth(handler);
