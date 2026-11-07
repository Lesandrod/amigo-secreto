'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export default function Login({ participants, onLoginSuccess, onOpenAdmin, onRefreshParticipants }) {
  const [selectedId, setSelectedId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedUser = participants.find((p) => p.id === selectedId);
  const isFirstTime = selectedUser ? !selectedUser.hasPassword : false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedId || !selectedUser) {
      setError('Selecciona tu nombre en la lista.');
      return;
    }

    if (isFirstTime) {
      if (!password || password.trim().length < 3) {
        setError('Crea una contraseña de al menos 3 caracteres.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/auth/register-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: selectedUser.id, password: password.trim() })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Error al guardar contraseña');
        }

        if (onRefreshParticipants) await onRefreshParticipants();
        onLoginSuccess(data.user, null, password.trim());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      if (!password) {
        setError('Ingresa tu contraseña.');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: selectedUser.id, password: password.trim() })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Contraseña incorrecta');
        }

        onLoginSuccess(data.user, data.assignedFriend, password.trim());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-[380px] mx-auto">
      <Card className="border-zinc-800 bg-zinc-900/90 shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-semibold tracking-tight text-white">
            Amigo Secreto
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs">
            {isFirstTime
              ? 'Es tu primer ingreso. Crea tu contraseña personal.'
              : 'Selecciona tu nombre e ingresa para ver a tu amigo secreto.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs text-zinc-300">Tu nombre</Label>
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                className="w-full h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-400 transition-colors"
                disabled={loading}
              >
                <option value="">Selecciona tu nombre</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {!p.hasPassword ? '(Primera vez)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedUser && (
              <>
                {isFirstTime ? (
                  <div className="space-y-3 pt-1 border-t border-zinc-800">
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-300">Crea tu contraseña</Label>
                      <div className="relative flex items-center">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 3 caracteres"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                          }}
                          className="h-10 border-zinc-700 bg-zinc-950 pr-10 text-sm"
                          disabled={loading}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 text-zinc-500 hover:text-zinc-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-300">Confirma tu contraseña</Label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Repite tu contraseña"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError('');
                        }}
                        className="h-10 border-zinc-700 bg-zinc-950 text-sm"
                        disabled={loading}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-300">Contraseña</Label>
                    <div className="relative flex items-center">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Tu contraseña personal"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError('');
                        }}
                        className="h-10 border-zinc-700 bg-zinc-950 pr-10 text-sm"
                        disabled={loading}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 text-zinc-500 hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-10 mt-2 font-medium" disabled={loading}>
              {loading
                ? 'Conectando...'
                : isFirstTime
                ? 'Guardar contraseña y continuar'
                : 'Ingresar'}
            </Button>
          </form>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span>Servidor Firebase</span>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="hover:text-zinc-300 transition-colors"
            >
              Organizador
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
