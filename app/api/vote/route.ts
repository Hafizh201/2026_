import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { type ResultSetHeader, type RowDataPacket } from 'mysql2';
import { db } from '../../../lib/db';

interface TokenRecord extends RowDataPacket {
  token: string;
  sudah_memilih: number;
}

interface ExistingVoteRecord extends RowDataPacket {
  candidate_id: number;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('auth_session')?.value ?? '';

  if (!sessionToken) {
    return NextResponse.json({ message: 'Sesi pemilih tidak ditemukan.' }, { status: 401 });
  }

  try {
    const body = await request.json() as { candidateId?: unknown };
    const candidateId = Number(body.candidateId);

    if (!Number.isInteger(candidateId) || candidateId < 1) {
      return NextResponse.json({ message: 'Paslon tidak valid.' }, { status: 400 });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [tokenRows] = await connection.execute<TokenRecord[]>(
        'SELECT token, sudah_memilih FROM token_akses WHERE token = ? FOR UPDATE',
        [sessionToken]
      );
      const tokenRecord = tokenRows[0];

      if (!tokenRecord) {
        await connection.rollback();
        return NextResponse.json({ message: 'Sesi pemilih tidak valid.' }, { status: 401 });
      }

      const [existingVotes] = await connection.execute<ExistingVoteRecord[]>(
        'SELECT candidate_id FROM votes WHERE token = ? LIMIT 1 FOR UPDATE',
        [sessionToken]
      );

      if (existingVotes.length > 0) {
        if (Number(tokenRecord.sudah_memilih) !== 1) {
          await connection.execute<ResultSetHeader>(
            'UPDATE token_akses SET sudah_memilih = 1 WHERE token = ?',
            [sessionToken]
          );
        }
        await connection.commit();
        return NextResponse.json(
          { success: false, alreadyRecorded: true, message: 'Suara untuk token ini sudah tercatat dan tidak dapat diubah.' },
          { status: 409 }
        );
      }

      if (Number(tokenRecord.sudah_memilih) === 1) {
        await connection.rollback();
        return NextResponse.json({ message: 'Token sudah digunakan.' }, { status: 409 });
      }

      const [candidateRows] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM candidates WHERE id = ? LIMIT 1',
        [candidateId]
      );

      if (candidateRows.length === 0) {
        await connection.rollback();
        return NextResponse.json({ message: 'Paslon tidak ditemukan.' }, { status: 404 });
      }

      await connection.execute<ResultSetHeader>(
        'INSERT INTO votes (token, candidate_id) VALUES (?, ?)',
        [sessionToken, candidateId]
      );
      await connection.execute<ResultSetHeader>(
        'UPDATE token_akses SET sudah_memilih = 1 WHERE token = ?',
        [sessionToken]
      );
      await connection.commit();

      return NextResponse.json({ success: true, message: 'Suara berhasil disimpan.' }, { status: 200 });
    } catch (error) {
      await connection.rollback();
      console.error('[VOTE_TRANSACTION]', error);
      return NextResponse.json({ message: 'Suara belum dapat disimpan.' }, { status: 500 });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[VOTE]', error);
    return NextResponse.json({ message: 'Permintaan vote tidak valid.' }, { status: 400 });
  }
}