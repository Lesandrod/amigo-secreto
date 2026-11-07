'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Eye, EyeOff, LogOut } from 'lucide-react';

export default function ResultCard({ currentUser, assignedFriend, onLogout }) {
  const [copied, setCopied] = useState(false);
  const [isConcealed, setIsConcealed] = useState(false);

  const handleCopy = () => {
    if (!assignedFriend) return;
    navigator.clipboard.writeText(assignedFriend.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!assignedFriend) {
    return (
      <Card className="w-full max-w-[400px] mx-auto p-6 text-center space-y-4">
        <p className="text-zinc-400 text-sm">Cargando resultado del sorteo...</p>
        <Button onClick={onLogout} variant="secondary">Cerrar sesión</Button>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-[400px] mx-auto space-y-3">
      <Card className="border-zinc-800 bg-zinc-900/90 shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Usuario: {currentUser.name}</span>
            <button
              type="button"
              onClick={() => setIsConcealed(!isConcealed)}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {isConcealed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span>{isConcealed ? 'Mostrar' : 'Ocultar'}</span>
            </button>
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight text-white">
            Tu Amigo Secreto
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs">
            Este resultado ya está asignado y registrado en la base de datos.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
              Te tocó regalarle a:
            </span>

            {isConcealed ? (
              <div className="py-4 text-zinc-600 text-sm font-mono">
                [Nombre oculto]
              </div>
            ) : (
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight py-2">
                {assignedFriend.name}
              </h2>
            )}

            {!isConcealed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8 gap-1.5 text-xs text-zinc-300 border-zinc-800 hover:bg-zinc-800 mt-2"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar nombre</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <p className="text-xs text-zinc-500 text-center leading-relaxed">
            Cada vez que inicies sesión verás directamente a tu amigo secreto asignado.
          </p>

          <Button
            variant="secondary"
            onClick={onLogout}
            className="w-full h-10 gap-1.5 text-xs font-medium"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Cerrar sesión</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
