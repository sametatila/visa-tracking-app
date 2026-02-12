import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { RawRow, Consulate, VisaType } from '@/lib/types';
import { buildFilterQuery, ORDER_BY, parseFilterSearchParams } from '@/lib/queryBuilder';
import { maskName } from '@/lib/maskUtils';
import { randomUUID } from 'crypto';
import { validateRowInput, isValidConsulate, isValidVisaType, sanitizeString } from '@/lib/validation';
import { recordVisitor, getActiveCount } from '@/lib/activeVisitors';

export async function GET(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    if (ip !== 'unknown') recordVisitor(ip);

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '200', 10)));
    const offset = (page - 1) * limit;

    const filterParams = parseFilterSearchParams(searchParams);
    const { where, args } = buildFilterQuery(filterParams);

    const [dataResult, countResult] = await Promise.all([
      db.execute({
        sql: `SELECT id, name, tr_consulate, de_city, visa_type, application_date, assignment_date, appointment_date, missing_docs, decision_email_date, sms_date, course_start FROM rows ${where} ${ORDER_BY} LIMIT ? OFFSET ?`,
        args: [...args, limit, offset],
      }),
      db.execute({
        sql: `SELECT COUNT(*) as cnt FROM rows ${where}`,
        args,
      }),
    ]);

    const totalCount = Number(countResult.rows[0].cnt);
    const rows: RawRow[] = dataResult.rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      tr_consulate: r.tr_consulate as Consulate,
      de_city: r.de_city as string,
      visa_type: r.visa_type as VisaType,
      application_date: r.application_date as string,
      assignment_date: r.assignment_date as string,
      appointment_date: r.appointment_date as string,
      missing_docs: r.missing_docs as string,
      decision_email_date: r.decision_email_date as string,
      sms_date: r.sms_date as string,
      course_start: r.course_start as string,
    }));

    return NextResponse.json({
      rows,
      totalCount,
      page,
      hasMore: offset + rows.length < totalCount,
      activeVisitors: getActiveCount(),
    });
  } catch (error) {
    console.error('GET /api/rows error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Veri alınamadı' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { errors, sanitized } = validateRowInput(body);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    const name = sanitized.name ? maskName(sanitized.name) : '';
    if (!name.trim()) {
      return NextResponse.json({ error: 'Kullanıcı adı zorunludur.' }, { status: 400 });
    }

    const consulateRaw = sanitizeString(body.tr_consulate, 20);
    const consulate = isValidConsulate(consulateRaw) ? consulateRaw : 'Diğer';

    const visaRaw = sanitizeString(body.visa_type, 20);
    const visaType = isValidVisaType(visaRaw) ? visaRaw : 'Diğer';

    const hasDate =
      sanitized.application_date ||
      sanitized.assignment_date ||
      sanitized.appointment_date;
    if (!hasDate) {
      return NextResponse.json(
        { error: 'Başvuru, Atama veya Randevu tarihlerinden en az biri girilmelidir.' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const row: RawRow = {
      id,
      name,
      tr_consulate: consulate,
      de_city: sanitized.de_city,
      visa_type: visaType,
      application_date: sanitized.application_date,
      assignment_date: sanitized.assignment_date,
      appointment_date: sanitized.appointment_date,
      missing_docs: sanitized.missing_docs,
      decision_email_date: sanitized.decision_email_date,
      sms_date: sanitized.sms_date,
      course_start: sanitized.course_start,
    };

    await db.execute({
      sql: `INSERT INTO rows (id, name, tr_consulate, de_city, visa_type, application_date, assignment_date, appointment_date, missing_docs, decision_email_date, sms_date, course_start) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        row.id,
        row.name,
        row.tr_consulate,
        row.de_city,
        row.visa_type,
        row.application_date,
        row.assignment_date,
        row.appointment_date,
        row.missing_docs,
        row.decision_email_date,
        row.sms_date,
        row.course_start,
      ],
    });

    return NextResponse.json({ row }, { status: 201 });
  } catch (error) {
    console.error('POST /api/rows error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Kayıt eklenemedi' }, { status: 500 });
  }
}
