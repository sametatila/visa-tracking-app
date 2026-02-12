import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { RawRow, Consulate, VisaType } from '@/lib/types';
import { buildFilterQuery, ORDER_BY, parseFilterSearchParams } from '@/lib/queryBuilder';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filterParams = parseFilterSearchParams(searchParams);
    const { where, args } = buildFilterQuery(filterParams);

    const [dataResult, unfilteredResult] = await Promise.all([
      db.execute({
        sql: `SELECT id, name, tr_consulate, de_city, visa_type, application_date, assignment_date, appointment_date, missing_docs, decision_email_date, sms_date, course_start FROM rows ${where} ${ORDER_BY}`,
        args,
      }),
      db.execute('SELECT COUNT(*) as cnt FROM rows'),
    ]);

    const totalUnfiltered = Number(unfilteredResult.rows[0].cnt);
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

    return NextResponse.json({ rows, totalUnfiltered });
  } catch (error) {
    console.error('GET /api/rows/stats error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'İstatistik verisi alınamadı' }, { status: 500 });
  }
}
