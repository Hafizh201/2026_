import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { type RowDataPacket } from 'mysql2';
import { db } from '../../../../lib/db';

interface TokenRecord extends RowDataPacket {
  sudah_memilih: number;
  has_vote: number;
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('auth_session');

  if (!session?.value) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const [rows] = await db.execute<TokenRecord[]>(
      `SELECT sudah_memilih,
        EXISTS (SELECT 1 FROM votes WHERE votes.token = token_akses.token) AS has_vote
      FROM token_akses WHERE token = ? LIMIT 1`,
      [session.value]
    );

    if (rows.length === 0 || Number(rows[0].sudah_memilih) === 1 || Number(rows[0].has_vote) === 1) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const tokenNumber = session.value.match(/(\d+)$/)?.[1] ?? '—';

    return NextResponse.json({ authenticated: true, tokenNumber }, { status: 200 });
  } catch (error) {
    console.error('[AUTH_ME]', error);
    return NextResponse.json({ authenticated: false }, { status: 503 });
  }
}
