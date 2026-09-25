// ----------------------------------------------------------------------
// Các trường chỉ phục vụ in hợp đồng đưa đi làm việc (HĐLĐ). Dùng chung cho
// company/create|edit và tradeUnion/create|edit để các nơi đọc body theo đúng một quy tắc:
//  - Company: tên trên hợp đồng, người đại diện, khối lương (đơn vị Yên).
//  - TradeUnion: tên trên hợp đồng.
//
// Khoá vắng mặt trong body -> không động tới. Khoá gửi lên rỗng -> $unset,
// không lưu '' hay null. Số tiền nhận cả dạng "205,000" / "205.000".
// ----------------------------------------------------------------------

export const COMPANY_MONEY_FIELDS = [
  'trainingAllowance',
  'salary',
  'tax',
  'socialInsurance',
  'housingFee',
] as const;

export class CompanyFieldError extends Error {}

function toMoney(key: string, value: unknown): number {
  const digits = typeof value === 'number' ? value : Number(String(value).replace(/[\s.,]/g, ''));
  if (!Number.isFinite(digits) || digits < 0) {
    throw new CompanyFieldError(`Invalid amount for ${key}`);
  }
  return digits;
}

const isEmpty = (value: unknown) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

type Update = { $set: Record<string, string | number>; $unset: Record<string, 1> };

function pickText(body: Record<string, unknown>, key: string, update: Update) {
  if (!(key in body)) return;
  if (isEmpty(body[key])) update.$unset[key] = 1;
  else update.$set[key] = String(body[key]).trim();
}

// Tên nghiệp đoàn/xí nghiệp trong CSDL thường là tiếng Nhật; `contractName` là tên in lên
// hợp đồng tiếng Việt (vd "Công Ty Kabushikigaisha Zero"). Trống thì in tên hiện tại.
export function pickTradeUnionContractFields(body: Record<string, unknown>): Update {
  const update: Update = { $set: {}, $unset: {} };
  pickText(body, 'contractName', update);
  return update;
}

export function pickCompanyContractFields(body: Record<string, unknown>): Update {
  const update: Update = { $set: {}, $unset: {} };
  const { $set, $unset } = update;

  pickText(body, 'contractName', update);
  pickText(body, 'director', update);

  COMPANY_MONEY_FIELDS.forEach((key) => {
    if (!(key in body)) return;
    if (isEmpty(body[key])) $unset[key] = 1;
    else $set[key] = toMoney(key, body[key]);
  });

  return update;
}
