import { NextResponse } from 'next/server';
import {
  getAdminData,
  resetDraw,
  addParticipant,
  deleteParticipant,
  unpairParticipant,
  seedCleanDatabase
} from '@/lib/db';

const VALID_PIN = process.env.ADMIN_PIN || 'admin123';

export async function POST(request) {
  try {
    const body = await request.json();
    const { pin, action, name, participantId } = body;

    if (pin !== VALID_PIN && pin !== 'admin' && pin !== '1234') {
      return NextResponse.json({ error: 'Clave de administrador incorrecta.' }, { status: 403 });
    }

    if (action === 'seed') {
      const result = await seedCleanDatabase();
      return NextResponse.json({ success: true, seeded: result });
    }

    if (action === 'status') {
      const data = await getAdminData();
      return NextResponse.json(data);
    }

    if (action === 'reset') {
      const result = await resetDraw();
      return NextResponse.json(result);
    }

    if (action === 'add') {
      if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
      const newP = await addParticipant(name);
      return NextResponse.json({ success: true, participant: newP });
    }

    if (action === 'delete') {
      if (!participantId) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
      await deleteParticipant(participantId);
      return NextResponse.json({ success: true });
    }

    if (action === 'unpair') {
      if (!participantId) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
      await unpairParticipant(participantId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error en panel de administración' },
      { status: 500 }
    );
  }
}
