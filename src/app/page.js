'use client';

import React, { useState, useEffect } from 'react';
import ParticipantSelector from '@/components/ParticipantSelector';
import Roulette from '@/components/Roulette';
import AdminModal from '@/components/AdminModal';

export default function Home() {
  const [participants, setParticipants] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchParticipants = async () => {
    try {
      const res = await fetch('/api/participants');
      const data = await res.json();
      if (data.participants) {
        setParticipants(data.participants);
      }
    } catch (e) {
      console.error('Error al cargar participantes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const handleSelectParticipant = (user) => {
    setActiveUser(user);
  };

  const handleFinishAndReturn = async () => {
    setActiveUser(null);
    await fetchParticipants();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f7f8fa] text-[#090a0f] antialiased">
      {/* Top Bar */}
      <header className="border-b border-[#e5e7eb] bg-white sticky top-0 z-40">
        <div className="max-w-4xl mx-auto h-14 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#090a0f]" />
            <span className="font-bold text-xs uppercase tracking-widest text-[#090a0f]">
              Amigo Secreto
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAdminOpen(true)}
            className="sharp-outline-btn px-3 py-1.5 text-[10px]"
          >
            Organizador
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {loading ? (
          <div className="text-xs font-mono uppercase tracking-widest text-neutral-400">
            Cargando...
          </div>
        ) : !activeUser ? (
          <ParticipantSelector
            participants={participants}
            onSelectParticipant={handleSelectParticipant}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />
        ) : (
          <Roulette
            currentUser={activeUser}
            participants={participants}
            onFinishAndReturn={handleFinishAndReturn}
            onCancel={() => setActiveUser(null)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e5e7eb] py-3.5 px-4 text-center bg-white">
        <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
          Amigo Secreto • Sorteo confidencial
        </p>
      </footer>

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onRefreshParticipants={fetchParticipants}
      />
    </div>
  );
}
