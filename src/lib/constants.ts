// 학교/과목 데이터는 DB로 이관됨. getSchools()/getSubjects() 또는 useCampData() 사용.
// 이 파일은 설정/옵션/상수값만 보관.

export const EDUCATION_OPTIONS = [
  "고졸",
  "전문학사",
  "학사",
  "석사",
  "박사",
] as const;

export const SUBJECT_CLOSE_THRESHOLD = 9999;

export const STATUS_OPTIONS = [
  { value: "pending", label: "접수완료", color: "bg-blue-100 text-blue-800" },
  { value: "reviewing", label: "검토중", color: "bg-yellow-100 text-yellow-800" },
  { value: "accepted", label: "선발", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "불합격", color: "bg-red-100 text-red-800" },
] as const;
