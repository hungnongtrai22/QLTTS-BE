// ----------------------------------------------------------------------
// Tìm kiếm tiếng Việt không phân biệt dấu, làm ở phía server.
//
// Trước đây frontend tải toàn bộ danh sách rồi tự bỏ dấu bằng normalize('NFD').
// Khi chuyển sang phân trang phía server thì việc lọc phải làm bằng truy vấn,
// mà MongoDB không có sẵn regex bỏ dấu (collation không áp dụng cho $regex,
// còn $text thì cần thêm text index — tức là đổi schema).
//
// Cách làm ở đây: bỏ dấu chuỗi người dùng gõ, rồi nở mỗi chữ cái thành một lớp
// ký tự chứa mọi biến thể có dấu. Nhờ vậy gõ "nguyen" hay "Nguyễn" đều khớp.
// ----------------------------------------------------------------------

const LETTER_VARIANTS: Record<string, string> = {
  a: 'aàáảãạăằắẳẵặâầấẩẫậ',
  d: 'dđ',
  e: 'eèéẻẽẹêềếểễệ',
  i: 'iìíỉĩị',
  o: 'oòóỏõọôồốổỗộơờớởỡợ',
  u: 'uùúủũụưừứửữự',
  y: 'yỳýỷỹỵ',
};

/** Bỏ dấu tiếng Việt và chuyển về chữ thường. */
export function removeVietnameseTones(value: string): string {
  return value
    .normalize('NFD')
    // p{Mn} = nonspacing mark: đúng tập dấu thanh/dấu mũ mà NFD tách ra.
    .replace(/\p{Mn}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** Escape các ký tự đặc biệt của regex để chuỗi người dùng gõ không phá truy vấn. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Dựng RegExp khớp không phân biệt dấu và không phân biệt hoa thường.
 * Trả về null nếu chuỗi tìm kiếm rỗng.
 */
export function buildDiacriticInsensitiveRegex(search: string): RegExp | null {
  const plain = removeVietnameseTones(`${search}`).trim();

  if (!plain) {
    return null;
  }

  const pattern = escapeRegex(plain)
    .split('')
    .map((char) => {
      const variants = LETTER_VARIANTS[char];

      if (!variants) {
        return char;
      }

      return `[${variants}${variants.toUpperCase()}]`;
    })
    .join('');

  return new RegExp(pattern, 'i');
}
