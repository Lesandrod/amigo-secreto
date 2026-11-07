import { NextResponse } from 'next/server';
import { getPublicParticipants } from '@/lib/db';

export async function GET() {
  try {
    const participants = await getPublicParticipants();
    return NextResponse.json({ participants });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener participantes' },
      { status: 500 }
    );
  }
}
