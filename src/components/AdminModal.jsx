'use client';

import React, { useState } from 'react';
import ImageCropperModal from './ImageCropperModal';

export default function AdminModal({ isOpen, onClose, onRefreshParticipants }) {
  const [adminPin, setAdminPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [newName, setNewName] = useState('');
  const [showSpoilers, setShowSpoilers] = useState(true);
  const [notice, setNotice] = useState('');
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropParticipant, setCropParticipant] = useState(null);

  if (!isOpen) return null;

  const loadAdminStatus = async (pin) => {
    setLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, action: 'status' })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Clave incorrecta');
      }
      setAdminData(data);
      setIsAuthenticated(true);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAuth = (e) => {
    e.preventDefault();
    loadAdminStatus(adminPin);
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin, action: 'add', name: newName.trim() })
      });
      if (res.ok) {
        setNewName('');
        setNotice('Participante agregado.');
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } catch {
      setNotice('Error al agregar');
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(''), 2500);
    }
  };

  const handleDeleteParticipant = async (id) => {
    if (adminData.participants.length <= 3) {
      alert('Deben existir al menos 3 participantes.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin, action: 'delete', participantId: id })
      });
      if (res.ok) {
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnpairParticipant = async (id, name) => {
    if (
      !window.confirm(
        `¿Deseas romper la pareja de ${name}? Su amigo asignado quedará libre de nuevo en la mesa y ${name} podrá volver a sacar su carta.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin, action: 'unpair', participantId: id })
      });
      if (res.ok) {
        setNotice(`Pareja de ${name} rota. Ahora puede volver a sortear.`);
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } catch {
      setNotice('Error al romper pareja.');
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(''), 3000);
    }
  };

  const handleSetPreference = async (giverId, receiverId) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: adminPin,
          action: 'setPreference',
          giverId,
          receiverId
        })
      });
      if (res.ok) {
        setNotice('Preferencia guardada.');
        await loadAdminStatus(adminPin);
      }
    } catch {
      setNotice('Error al fijar preferencia.');
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(''), 2500);
    }
  };

  const handleSelectFileForCrop = (participant, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropImageSrc(e.target.result);
      setCropParticipant(participant);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCroppedPhoto = async (croppedBase64) => {
    if (!cropParticipant) return;
    const participantId = cropParticipant.id;
    const participantName = cropParticipant.name;

    setCropImageSrc(null);
    setCropParticipant(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: adminPin,
          action: 'updatePhoto',
          participantId,
          photoUrl: croppedBase64
        })
      });
      if (res.ok) {
        setNotice(`Foto de ${participantName} recortada y guardada.`);
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } catch {
      setNotice('Error al guardar foto recortada.');
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(''), 2500);
    }
  };

  const handleResetDraw = async () => {
    if (
      !window.confirm(
        '¿Deseas reiniciar el sorteo? Se borrarán todas las asignaciones y cada amigo se elegirá 100% al azar en el momento exacto en que cada uno presione girar.'
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin, action: 'reset' })
      });
      if (res.ok) {
        setNotice('Sorteo reiniciado exitosamente.');
        await loadAdminStatus(adminPin);
        if (onRefreshParticipants) await onRefreshParticipants();
      }
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(''), 2500);
    }
  };

  const participants = adminData?.participants || [];
  const pairings = adminData?.pairings || {};
  const preferences = adminData?.preferences || {};
  const revealedCount = participants.filter((p) => p.revealed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col sharp-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e5e7eb]">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#090a0f]">
              Panel del Organizador
            </h2>
            <span className="text-[10px] font-mono uppercase text-neutral-500">
              Control general de parejas y participantes
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-black text-sm font-mono p-1"
          >
            [X]
          </button>
        </div>

        {!isAuthenticated ? (
          <form onSubmit={handleAdminAuth} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block">
                Contraseña de administrador
              </label>
              <input
                type="password"
                placeholder="Ingresa la clave"
                value={adminPin}
                onChange={(e) => {
                  setAdminPin(e.target.value);
                  setAuthError('');
                }}
                className="w-full h-10 px-3 bg-[#f9fafb] border border-[#d1d5db] text-[#090a0f] text-xs font-mono outline-none focus:border-black transition-colors"
                autoFocus
              />
            </div>

            {authError && (
              <div className="text-xs text-red-600 font-mono">{authError}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="sharp-primary-btn w-full h-10"
            >
              {loading ? 'Verificando...' : 'Acceder al panel'}
            </button>
          </form>
        ) : (
          <div className="p-6 overflow-y-auto space-y-5">
            {notice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono text-center">
                {notice}
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-3 bg-[#f9fafb] border border-[#e5e7eb]">
                <div className="text-lg font-bold text-[#090a0f]">{participants.length}</div>
                <div className="text-[9px] uppercase text-neutral-500">Total</div>
              </div>
              <div className="p-3 bg-[#f9fafb] border border-[#e5e7eb]">
                <div className="text-lg font-bold text-[#090a0f]">{revealedCount}</div>
                <div className="text-[9px] uppercase text-neutral-500">Sortearon</div>
              </div>
              <div className="p-3 bg-[#f9fafb] border border-[#e5e7eb]">
                <div className="text-lg font-bold text-neutral-500">{participants.length - revealedCount}</div>
                <div className="text-[9px] uppercase text-neutral-500">Pendientes</div>
              </div>
            </div>

            {/* Add Participant */}
            <form onSubmit={handleAddParticipant} className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                Agregar nuevo amigo
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre y apellido"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 h-9 px-3 bg-[#f9fafb] border border-[#d1d5db] text-[#090a0f] text-xs outline-none focus:border-black"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="sharp-outline-btn px-4 h-9"
                >
                  Agregar
                </button>
              </div>
            </form>

            {/* Master Table */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                <span>Resultados en tiempo real (Sorteo en vivo)</span>
                <button
                  type="button"
                  onClick={() => setShowSpoilers(!showSpoilers)}
                  className="hover:text-black transition-colors"
                >
                  {showSpoilers ? '[Ocultar nombres]' : '[Mostrar nombres]'}
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto border border-[#e5e7eb] bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#f9fafb] text-neutral-500 border-b border-[#e5e7eb] text-[10px] font-mono uppercase sticky top-0">
                    <tr>
                      <th className="p-2.5 font-medium">Participante</th>
                      <th className="p-2.5 font-medium">Estado</th>
                      <th className="p-2.5 font-medium">Le regala a / Preferencia</th>
                      <th className="p-2.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f2f4]">
                    {participants.map((p) => {
                      const targetId = pairings[p.id];
                      const targetFriend = participants.find((x) => x.id === targetId);
                      const currentPrefId = preferences[p.id] || '';
                      // Friends already reserved by someone else's preference
                      const otherReservedIds = new Set(
                        Object.entries(preferences)
                          .filter(([gId]) => gId !== p.id)
                          .map(([, rId]) => rId)
                      );

                      return (
                        <tr key={p.id} className="hover:bg-[#f9fafb]">
                          <td className="p-2.5 font-medium text-neutral-900">
                            <div className="flex items-center gap-2">
                              <label
                                className="relative cursor-pointer group flex-shrink-0"
                                title="Clic para subir/cambiar foto"
                              >
                                {p.photoUrl ? (
                                  <img
                                    src={p.photoUrl}
                                    alt={p.name}
                                    className="w-7 h-7 rounded-full object-cover border border-neutral-300 group-hover:opacity-75 transition-opacity"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center text-[10px] text-neutral-600 font-bold group-hover:bg-neutral-300 transition-colors">
                                    {p.name.charAt(0)}
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    handleSelectFileForCrop(p, e.target.files?.[0]);
                                    e.target.value = '';
                                  }}
                                  className="hidden"
                                />
                              </label>
                              <span className="truncate">{p.name}</span>
                            </div>
                          </td>
                          <td className="p-2.5 font-mono text-[10px] uppercase">
                            <span className={p.revealed ? 'text-emerald-700 font-semibold' : 'text-neutral-400'}>
                              {p.revealed ? 'Listo' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="p-2.5 font-medium">
                            {p.revealed ? (
                              showSpoilers ? (
                                <span className="text-[#090a0f] font-semibold">
                                  {targetFriend ? targetFriend.name : '—'}
                                </span>
                              ) : (
                                <span className="text-neutral-300 font-mono">••••••••</span>
                              )
                            ) : (
                              <select
                                value={currentPrefId}
                                onChange={(e) => handleSetPreference(p.id, e.target.value)}
                                className={`text-[10px] font-mono h-7 px-1.5 border outline-none cursor-pointer max-w-[170px] truncate ${
                                  currentPrefId
                                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                                    : 'bg-[#f9fafb] border-[#d1d5db] text-neutral-500 hover:border-black'
                                }`}
                                title="Predefinir a quién le regalará (truco de organizador)"
                              >
                                <option value="">(Al azar - Sin fijar)</option>
                                {participants
                                  .filter((other) => other.id !== p.id && (!otherReservedIds.has(other.id) || currentPrefId === other.id))
                                  .map((other) => (
                                    <option key={other.id} value={other.id}>
                                      Fijar a: {other.name}
                                    </option>
                                  ))}
                              </select>
                            )}
                          </td>
                          <td className="p-2.5 text-right whitespace-nowrap">
                            {p.revealed && (
                              <button
                                type="button"
                                onClick={() => handleUnpairParticipant(p.id, p.name)}
                                title={`Romper pareja de ${p.name} para que pueda volver a sortear`}
                                className="text-amber-700 hover:text-amber-900 font-mono text-[11px] font-semibold px-2 py-0.5 mr-1 hover:underline"
                              >
                                [Romper pareja]
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteParticipant(p.id)}
                              className="text-neutral-400 hover:text-red-600 font-mono text-xs px-2 py-0.5"
                            >
                              [Eliminar]
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reset */}
            <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-neutral-500">
                ¿Reiniciar todo el sorteo?
              </span>
              <button
                type="button"
                onClick={handleResetDraw}
                disabled={loading}
                className="sharp-outline-btn px-3 py-1.5 text-[10px]"
              >
                Reiniciar sorteo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recortador interactivo de fotos */}
      <ImageCropperModal
        isOpen={Boolean(cropImageSrc)}
        imageSrc={cropImageSrc}
        participantName={cropParticipant?.name || ''}
        onSave={handleSaveCroppedPhoto}
        onClose={() => {
          setCropImageSrc(null);
          setCropParticipant(null);
        }}
      />
    </div>
  );
}
