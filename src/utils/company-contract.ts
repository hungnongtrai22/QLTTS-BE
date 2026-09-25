// ----------------------------------------------------------------------
// Các trường của Company chỉ phục vụ in hợp đồng đưa đi làm việc (HĐLĐ):
// người đại diện và khối lương (đơn vị Yên). Dùng chung cho company/create và
// company/edit để hai nơi đọc body theo đúng một quy tắc.
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

export function pickCompanyContractFields(body: Record<string, unknown>) {
  const $set: Record<string, string | number> = {};
  const $unset: Record<string, 1> = {};

  if ('director' in body) {
    if (isEmpty(body.director)) $unset.director = 1;
    else $set.director = String(body.director).trim();
  }

  COMPANY_MONEY_FIELDS.forEach((key) => {
    if (!(key in body)) return;
    if (isEmpty(body[key])) $unset[key] = 1;
    else $set[key] = toMoney(key, body[key]);
  });

  return { $set, $unset };
}
