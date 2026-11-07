'use client';

import React, { useState } from 'react';

export default function ParticipantSelector({ participants, onSelectParticipant, onOpenAdmin }) {
  const [selectedId, setSelectedId] = useState('');

  const selectedUser = participants.find((p) => p.id === selectedId);
  const remainingCount = participants.filter((p) => !p.revealed).length;

  const handleContinue = () => {
    if (selectedUser && !selectedUser.revealed) {
      onSelectParticipant(selectedUser);
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1">
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
    </div>
  );
}
