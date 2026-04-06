import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getServiceSupabase } from "@/lib/supabase";
import { applicantSchema } from "@/lib/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = applicantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const data = parsed.data;

    const { data: applicant, error: insertError } = await getSupabase()
      .from("applicants")
      .insert({
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        birth_date: data.birthDate,
        education: data.education,
        major: data.major || null,
        experience: data.experience,
        qualifications: data.qualifications || null,
        introduction: data.introduction || null,
        privacy_agreed: data.privacyAgreed,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Applicant insert error:", insertError);
      return NextResponse.json(
        { error: "지원서 저장에 실패했습니다" },
        { status: 500 }
      );
    }

    const schoolRows = data.schools.map((schoolId) => ({
      applicant_id: applicant.id,
      school_id: schoolId,
    }));
    const subjectRows = data.subjects.map((subjectId) => ({
      applicant_id: applicant.id,
      subject_id: subjectId,
    }));

    const [schoolResult, subjectResult] = await Promise.all([
      getSupabase().from("applicant_schools").insert(schoolRows),
      getSupabase().from("applicant_subjects").insert(subjectRows),
    ]);

    if (schoolResult.error || subjectResult.error) {
      console.error("Relation insert error:", schoolResult.error, subjectResult.error);
    }

    return NextResponse.json(
      { data: { id: applicant.id }, message: "지원서가 접수되었습니다" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const serviceSupabase = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const school = searchParams.get("school");
  const subject = searchParams.get("subject");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = serviceSupabase
    .from("applicants")
    .select(`
      *,
      applicant_schools(school_id),
      applicant_subjects(subject_id)
    `)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Fetch applicants error:", error);
    return NextResponse.json(
      { error: "지원자 목록을 불러오지 못했습니다" },
      { status: 500 }
    );
  }

  let filtered = data || [];

  if (school) {
    filtered = filtered.filter((a: Record<string, unknown>) =>
      (a.applicant_schools as { school_id: string }[])?.some(
        (s) => s.school_id === school
      )
    );
  }
  if (subject) {
    filtered = filtered.filter((a: Record<string, unknown>) =>
      (a.applicant_subjects as { subject_id: string }[])?.some(
        (s) => s.subject_id === subject
      )
    );
  }

  return NextResponse.json({ data: filtered });
}
