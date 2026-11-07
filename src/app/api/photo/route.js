import { NextResponse } from 'next/server';
import { updateParticipantPhoto } from '@/lib/db';

export async function POST(request) {
  try {
    const { participantId, photoUrl } = await request.json();

    if (!participantId) {
      return NextResponse.json({ error: 'participantId requerido' }, { status: 400 });
    }

    await updateParticipantPhoto(participantId, photoUrl);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar foto' },
      { status: 500 }
    );
  }
}
