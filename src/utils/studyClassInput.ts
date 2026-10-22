import { isValidObjectId } from 'mongoose';
import StudyClass from 'src/models/studyClass';

// ----------------------------------------------------------------------
// Dùng chung cho studyClass/create và studyClass/edit.

const NAME_MAX = 100;
const TEACHER_MAX = 100;

export type StudyClassInput = { name: string; teacher: string };

// Tên bắt buộc; giáo viên tùy chọn (rỗng = chưa gán). Cắt khoảng trắng hai đầu.
export function cleanStudyClassInput(body: any): StudyClassInput | { message: string } {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const teacher = typeof body?.teacher === 'string' ? body.teacher.trim() : '';
  if (!name) return { message: 'Tên lớp không được để trống' };
  if (name.length > NAME_MAX) return { message: `Tên lớp tối đa ${NAME_MAX} ký tự` };
  if (teacher.length > TEACHER_MAX) return { message: `Tên giáo viên tối đa ${TEACHER_MAX} ký tự` };
  return { name, teacher };
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Bộ lọc ở trang Báo cáo học tập đi theo tên lớp, nên không cho hai lớp trùng tên
// (không phân biệt hoa thường). excludeId: lớp đang sửa.
export function studyClassNameTaken(name: string, excludeId?: string) {
  const query: Record<string, unknown> = { name: new RegExp(`^${escapeRegex(name)}$`, 'i') };
  if (excludeId && isValidObjectId(excludeId)) query._id = { $ne: excludeId };
  return StudyClass.exists(query);
}
