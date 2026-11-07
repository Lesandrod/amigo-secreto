'use client';

import React, { useState } from 'react';
import ImageCropperModal from './ImageCropperModal';

export default function ParticipantSelector({
  participants,
  onSelectParticipant,
  onOpenAdmin,
  onRefreshParticipants
}) {
  const [selectedId, setSelectedId] = useState('');
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropParticipant, setCropParticipant] = useState(null);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

  const selectedUser = participants.find((p) => p.id === selectedId);
  const remainingCount = participants.filter((p) => !p.revealed).length;

  const handleContinue = () => {
    if (selectedUser && !selectedUser.revealed) {
      onSelectParticipant(selectedUser);
    }
  };

  const handleSelectFile = (participant, file) => {
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
    setIsUpdatingPhoto(true);
    try {
      const res = await fetch('/api/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: cropParticipant.id,
          photoUrl: croppedBase64
        })
      });
      if (res.ok && onRefreshParticipants) {
        await onRefreshParticipants();
      }
    } catch (err) {
      console.error('Error al guardar foto:', err);
    } finally {
      setIsUpdatingPhoto(false);
      setCropImageSrc(null);
      setCropParticipant(null);
    }
  };

  return (
    <div className="w-full max-w-[520px] mx-auto">
      <div className="sharp-card p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-1 pb-3 border-b border-[#e5e7eb]">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-neutral-500">
            <span>Sorteo Privado</span>
            <span>{remainingCount} de {participants.length} pendientes</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#090a0f] uppercase">
            Amigo Secreto
          </h1>
          <p className="text-xs text-neutral-500">
            Selecciona tu nombre en la lista para sacar tu papelito.
          </p>
        </div>

        {/* Sharp Grid of Names */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
          {participants.map((p) => {
            const isSelected = p.id === selectedId;
            const isBlocked = p.revealed;

            return (
              <button
                key={p.id}
                type="button"
                disabled={isBlocked}
                onClick={() => setSelectedId(p.id)}
                className={`flex flex-col items-start justify-center p-3 text-left transition-all border ${
                  isBlocked
                    ? 'opacity-40 cursor-not-allowed bg-[#f3f4f6] border-[#e5e7eb] text-neutral-400'
                    : isSelected
                    ? 'bg-[#f8fafc] border-[#090a0f] ring-1 ring-[#090a0f] text-[#090a0f]'
                    : 'bg-white hover:bg-[#fafafa] border-[#e5e7eb] hover:border-[#a3a3a3] text-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2 w-full mb-1">
                  {p.photoUrl ? (
                    <img
                      src={p.photoUrl}
                      alt={p.name}
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-neutral-300"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wide truncate">
                    {p.name}
                  </span>
                </div>

                <span className={`text-[10px] font-mono uppercase tracking-wider mt-1 ${
                  isBlocked ? 'text-neutral-400' : isSelected ? 'text-[#090a0f] font-semibold' : 'text-neutral-500'
                }`}>
                  {isBlocked ? 'Listo' : isSelected ? 'Elegido' : 'Disponible'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected User Photo / Details Banner */}
        {selectedUser && (
          <div className="p-3 bg-[#f9fafb] border border-[#e5e7eb] flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {selectedUser.photoUrl ? (
                <img
                  src={selectedUser.photoUrl}
                  alt={selectedUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-neutral-300 flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {selectedUser.name.charAt(0)}
                </div>
              )}
              <div className="truncate">
                <div className="text-xs font-bold uppercase text-[#090a0f] truncate">
                  {selectedUser.name}
                </div>
                <div className="text-[10px] font-mono text-neutral-500">
                  {selectedUser.photoUrl ? 'Foto lista' : 'Sin foto de perfil'}
                </div>
              </div>
            </div>

            <label className="cursor-pointer text-[10px] font-mono uppercase tracking-wider px-2.5 py-1.5 border border-neutral-300 hover:border-black bg-white text-[#090a0f] font-semibold flex-shrink-0 transition-colors shadow-sm">
              {isUpdatingPhoto ? 'Guardando...' : selectedUser.photoUrl ? 'Recortar / Cambiar foto' : '+ Subir y recortar foto'}
              <input
                type="file"
                accept="image/*"
                disabled={isUpdatingPhoto}
                onChange={(e) => {
                  handleSelectFile(selectedUser, e.target.files?.[0]);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          disabled={!selectedId || (selectedUser && selectedUser.revealed)}
          onClick={handleContinue}
          className="sharp-primary-btn w-full h-12"
        >
          {selectedUser ? `Continuar con ${selectedUser.name}` : 'Selecciona tu nombre'}
        </button>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#e5e7eb] text-[11px] font-mono uppercase tracking-wider text-neutral-500">
          <span>Papelitos confidenciales</span>

          <button
            type="button"
            onClick={onOpenAdmin}
            className="text-neutral-600 hover:text-black transition-colors"
          >
            Organizador
          </button>
        </div>
      </div>

      {/* Image Cropper Modal */}
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
