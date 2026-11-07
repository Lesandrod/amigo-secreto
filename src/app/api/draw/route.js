import { NextResponse } from 'next/server';
import { revealAndLockFriend } from '@/lib/db';

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Selecciona tu nombre.' },
        { status: 400 }
      );
    }

    const result = await revealAndLockFriend(userId);

    return NextResponse.json({
      success: true,
      assignedFriend: result.assignedFriend,
      otherCandidates: result.otherCandidates || []
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al ejecutar el sorteo' },
      { status: 400 }
    );
  }
}
