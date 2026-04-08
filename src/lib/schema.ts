import { z } from "zod";
import { EDUCATION_OPTIONS, SCHOOLS, SUBJECTS } from "./constants";

export const applicantSchema = z.object({
  name: z
    .string()
    .min(2, "이름은 2자 이상 입력해주세요")
    .max(10, "이름은 10자 이내로 입력해주세요")
    .regex(/^[가-힣]+$/, "한글 이름만 입력 가능합니다"),
  phone: z
    .string()
    .regex(/^010-\d{4}-\d{4}$/, "010-XXXX-XXXX 형식으로 입력해주세요"),
  email: z.string().email("올바른 이메일 형식을 입력해주세요"),
  address: z
    .string()
    .min(3, "주소를 입력해주세요 (예: 화성시 봉담읍)")
    .max(100, "주소는 100자 이내로 입력해주세요"),
  birthDate: z.string().min(1, "생년월일을 선택해주세요"),
  schools: z
    .array(z.enum(SCHOOLS.map((s) => s.id) as [string, ...string[]]))
    .min(1, "지원할 학교를 1개 이상 선택해주세요"),
  subjects: z
    .array(z.enum(SUBJECTS.map((s) => s.id) as [string, ...string[]]))
    .min(1, "1순위 과목을 선택해주세요")
    .max(3, "최대 3순위까지 선택 가능합니다"),
  education: z.enum(EDUCATION_OPTIONS),
  major: z.string().optional(),
  experience: z
    .string()
    .min(20, "경력사항을 20자 이상 입력해주세요"),
  qualifications: z.string().optional(),
  introduction: z
    .string()
    .max(500, "자기소개는 500자 이내로 입력해주세요")
    .optional(),
  privacyAgreed: z.literal(true, {
    error: "개인정보 수집·이용에 동의해주세요",
  }),
});

export type ApplicantFormData = z.infer<typeof applicantSchema>;
