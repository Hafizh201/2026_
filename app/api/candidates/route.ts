import { NextResponse } from 'next/server';
import { type RowDataPacket } from 'mysql2';
import { db } from '../../../lib/db';

interface CandidateRecord extends RowDataPacket {
  id: number;
  nama: string;
  photo: string;
  ketua: string;
  wakil: string;
}

export async function GET() {
  try {
    const [rows] = await db.execute<CandidateRecord[]>(
      'SELECT id, nama, photo, ketua, wakil FROM candidates ORDER BY id ASC'
    );

    return NextResponse.json({ candidates: rows }, { status: 200 });
  } catch (error) {
    console.error('[CANDIDATES]', error);
    return NextResponse.json(
      { message: 'Data paslon belum dapat dimuat.' },
      { status: 500 }
    );
  }
}