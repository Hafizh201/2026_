import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { type ResultSetHeader, type RowDataPacket } from 'mysql2';
import { db } from '../../../lib/db';

interface TokenRecord extends RowDataPacket {
  token: string;
  sudah_memilih: number;
}

export async function POST(request: Request) {
  let token = '';

  try {
    const body = await request.json() as { token?: unknown };
    token = typeof body.token === 'string' ? body.token.trim() : '';
    const timestamp = new Date().toLocaleString('id-ID');

    if (!token) {
      console.log('[VERIFY_QR]', { timestamp, status: 'DITOLAK', reason: 'TOKEN_KOSONG' });
      return NextResponse.json(
        { success: false, message: 'Token QR tidak terdaftar' },
        { status: 401 }
      );
    }

    const [rows] = await db.execute<TokenRecord[]>(
      'SELECT * FROM token_akses WHERE token = ?',
      [token]
    );
    const tokenRecord = rows[0];

    if (!tokenRecord) {
      console.log('[VERIFY_QR]', { timestamp, token, status: 'DITOLAK', reason: 'TOKEN_TIDAK_TERDAFTAR' });
      return NextResponse.json(
        { success: false, message: 'Token QR tidak terdaftar' },
        { status: 401 }
      );
    }

    if (Number(tokenRecord.sudah_memilih) === 1) {
      console.log('[VERIFY_QR]', { timestamp, token, status: 'DITOLAK', reason: 'TOKEN_SUDAH_DIGUNAKAN' });
      return NextResponse.json(
        { success: false, message: 'Token sudah pernah digunakan' },
        { status: 403 }
      );
    }

    const [updateResult] = await db.execute<ResultSetHeader>(
      'UPDATE token_akses SET sudah_memilih = 1 WHERE token = ? AND sudah_memilih = 0',
      [token]
    );

    if (updateResult.affectedRows !== 1) {
      console.log('[VERIFY_QR]', { timestamp, token, status: 'DITOLAK', reason: 'TOKEN_SUDAH_DIGUNAKAN' });
      return NextResponse.json(
        { success: false, message: 'Token sudah pernah digunakan' },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set('auth_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    console.log('[VERIFY_QR]', { timestamp, token, status: 'BERHASIL' });
    return NextResponse.json(
      { success: true, message: 'Otentikasi berhasil' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[VERIFY_QR]', { token, status: 'ERROR', error });
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}