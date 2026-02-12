import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { RawRow, Consulate, VisaType, ColumnKey } from '@/lib/types';
import { maskName } from '@/lib/maskUtils';
import { sanitizeString, validateDateField, isValidConsulate, isValidVisaType, getMaxLength } from '@/lib/validation';

const EDITABLE_KEYS: ColumnKey[] = [
  'name', 'tr_consulate', 'de_city', 'visa_type',
  'application_date', 'assignment_date', 'appointment_date',
  'missing_docs', 'decision_email_date', 'sms_date', 'course_start',
];

// Whitelist map: kullanıcı girdisini güvenli SQL sütun adına çevirir
const COLUMN_MAP: Record<string, string> = {};
for (const k of EDITABLE_KEYS) {
  COLUMN_MAP[k] = k;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.length > 100) {
      return NextResponse.json({ error: 'Geçersiz ID.' }, { status: 400 });
    }

    const body = await request.json();
    const key = String(body.key ?? '');

    const safeColumn = COLUMN_MAP[key];
    if (!safeColumn) {
      return NextResponse.json({ error: 'Geçersiz alan.' }, { status: 400 });
    }

    let value = sanitizeString(body.value, getMaxLength(key));

    // Tarih formatı validasyonu
    const dateError = validateDateField(key, value);
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 });
    }

    if (key === 'name') {
      value = maskName(value);
      if (!value.trim()) {
        return NextResponse.json({ error: 'Kullanıcı adı boş bırakılamaz.' }, { status: 400 });
      }
    }

    if (key === 'tr_consulate' && !isValidConsulate(value)) {
      return NextResponse.json({ error: 'Geçersiz konsolosluk.' }, { status: 400 });
    }

    if (key === 'visa_type' && !isValidVisaType(value)) {
      return NextResponse.json({ error: 'Geçersiz vize türü.' }, { status: 400 });
    }

    await db.execute({
      sql: `UPDATE rows SET ${safeColumn} = ? WHERE id = ?`,
      args: [value, id],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM rows WHERE id = ?',
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 });
    }

    const r = result.rows[0];
    const row: RawRow = {
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
    };

    return NextResponse.json({ row });
  } catch (error) {
    console.error('PUT /api/rows/[id] error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Kayıt güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.length > 100) {
      return NextResponse.json({ error: 'Geçersiz ID.' }, { status: 400 });
    }

    const result = await db.execute({
      sql: 'DELETE FROM rows WHERE id = ?',
      args: [id],
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/rows/[id] error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Kayıt silinemedi' }, { status: 500 });
  }
}
