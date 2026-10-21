import { isValidObjectId } from 'mongoose';
import Intern from 'src/models/intern';
import { AuthError } from 'src/utils/auth';

// ----------------------------------------------------------------------
// Giới hạn dữ liệu TTS theo tài khoản đang đăng nhập.
//
// withAuth chỉ kiểm tra role. Endpoint mở cho role khác admin phải dùng thêm các hàm ở đây:
// nếu không, một tài khoản nghiệp đoàn chỉ cần đổi id / mã nghiệp đoàn trong request là xem
// được TTS của nghiệp đoàn khác (giao diện chỉ ẩn bớt, không chặn được).
//
// - admin: mọi TTS.
// - tradeunion: TTS cùng nghiệp đoàn; tài khoản có companySelect thì chỉ các công ty đó.
// - source: TTS cùng nguồn.
// - demo: TTS trong internsDemo.
// - dongthap: TTS có địa chỉ ở Đồng Tháp (cùng điều kiện với user/listByDongThap).
// ----------------------------------------------------------------------

export const DONG_THAP_REGEX = /đồng tháp|dong thap/i;

// Bộ lọc không khớp TTS nào — cho role lạ hoặc tài khoản thiếu nghiệp đoàn / nguồn.
const MATCH_NONE = { _id: { $in: [] } };

export type ScopedAccount = {
  _id: unknown;
  role: string;
  tradeUnion?: unknown;
  companySelect?: unknown[];
  source?: unknown;
  internsDemo?: unknown[];
};

// Account do withAuth gắn vào request.
export const accountOf = (req: unknown) => (req as { account: ScopedAccount }).account;

export const isAdmin = (account: ScopedAccount) => account?.role === 'admin';

/** Bộ lọc Intern cho tài khoản. null = không giới hạn (admin). */
export function internScope(account: ScopedAccount): Record<string, unknown> | null {
  switch (account?.role) {
    case 'admin':
      return null;
    case 'tradeunion': {
      if (!account.tradeUnion) return MATCH_NONE;
      const companies = account.companySelect || [];
      return companies.length
        ? { tradeUnion: account.tradeUnion, companySelect: { $in: companies } }
        : { tradeUnion: account.tradeUnion };
    }
    case 'source':
      return account.source ? { source: account.source } : MATCH_NONE;
    case 'demo':
      return { _id: { $in: account.internsDemo || [] } };
    case 'dongthap':
      return {
        $or: [{ address: { $regex: DONG_THAP_REGEX } }, { city: { $regex: DONG_THAP_REGEX } }],
      };
    default:
      return MATCH_NONE;
  }
}

/** Ghép bộ lọc của endpoint với phạm vi của tài khoản. */
export function scoped(account: ScopedAccount, filter: Record<string, unknown> = {}) {
  const scope = internScope(account);
  return scope ? { $and: [filter, scope] } : filter;
}

/** Ném 400 nếu internId hỏng, 403 nếu TTS nằm ngoài phạm vi tài khoản. */
export async function assertInternAccess(account: ScopedAccount, internId: unknown) {
  if (!internId || !isValidObjectId(internId)) {
    throw new AuthError(400, 'Missing or invalid internId');
  }
  const scope = internScope(account);
  if (!scope) return;
  if (!(await Intern.exists({ $and: [{ _id: internId }, scope] }))) {
    throw new AuthError(403, 'Không có quyền xem thực tập sinh này');
  }
}

/** Chỉ giữ những id TTS nằm trong phạm vi tài khoản. */
export async function filterInternIds(account: ScopedAccount, ids: unknown[]) {
  const valid = ids.filter((id) => isValidObjectId(id));
  if (!internScope(account)) return valid.map(String);
  const found = await Intern.find(scoped(account, { _id: { $in: valid } })).distinct('_id');
  return found.map(String);
}

// ----------------------------------------------------------------------
// Trường gửi cho đối tác (mọi role khác admin).

// Giấy tờ / liên lạc / hợp đồng: CV và các file PDF đối tác tải về không dùng tới.
export const PARTNER_HIDDEN_FIELDS = [
  'citizenId',
  'citizenDate',
  'citizenPlace',
  'passportId',
  'passportDate',
  'street',
  'state',
  'postelCode',
  'phone',
  'phoneNumber',
  'email',
  'contractId',
  'contractDate',
  'contractPeriod',
  'contractResult',
  'emergencyContactName',
  'emergencyContactRelationship',
  'emergencyContactPhone',
];

export const PARTNER_HIDDEN_SELECT = PARTNER_HIDDEN_FIELDS.map((field) => `-${field}`).join(' ');

// Bảng danh sách TTS của nghiệp đoàn / nguồn / Đồng Tháp chỉ cần chừng này (+ _id).
export const PARTNER_LIST_SELECT =
  'name namejp avatar gender birthday status type job interviewDate studyDate startDate departureDate returnDate tradeUnion companySelect source';

// Nghiệp đoàn / công ty / nguồn: đối tác chỉ cần tên. Company còn chứa giám đốc, lương,
// thuế… của hợp đồng lao động.
export const REF_NAME_SELECT = 'name';

/** Select cho Intern: admin xem đủ, đối tác bỏ giấy tờ / liên lạc / hợp đồng. */
export const internSelectFor = (account: ScopedAccount) =>
  isAdmin(account) ? '' : PARTNER_HIDDEN_SELECT;

/** Select cho nghiệp đoàn / công ty / nguồn khi populate. */
export const refSelectFor = (account: ScopedAccount) => (isAdmin(account) ? '' : REF_NAME_SELECT);
