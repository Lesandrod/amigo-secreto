'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import gsap from 'gsap';
import { sounds } from '@/utils/audio';

export default function Roulette({ currentUser, participants, onFinishAndReturn, onCancel }) {
  const containerRef = useRef(null);
  const handRef = useRef(null);

  // Available candidates count: total friends - 1 (self) - already taken
  const takenCount = participants.filter((p) => p.revealed).length;
  const initialCardsCount = Math.max(1, participants.length - 1 - takenCount);

  // Cards state
  const [cardDeck, setCardDeck] = useState(() =>
    Array.from({ length: initialCardsCount }, (_, i) => ({
      id: i + 1,
      label: `#0${i + 1}`,
      name: null
    }))
  );

  const [selectedCardId, setSelectedCardId] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isDealing, setIsDealing] = useState(true);
  const [isHandVisible, setIsHandVisible] = useState(false);
  const [isFlippingChosen, setIsFlippingChosen] = useState(false);
  const [hasRevealedChosen, setHasRevealedChosen] = useState(false);
  const [hasRevealedOthers, setHasRevealedOthers] = useState(false);
  const [assignedFriend, setAssignedFriend] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // 1. Initial dealing animation on mount (Reparto de cartas sobre la mesa)
  useEffect(() => {
    if (!containerRef.current) return;

    setIsDealing(true);
    const cardElements = containerRef.current.querySelectorAll('.card-item');
    if (!cardElements.length) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const centerX = parentRect.width / 2;

    const ctx = gsap.context(() => {
      // All cards start stacked above the table at the dealer position
      gsap.set(cardElements, {
        opacity: 0,
        x: (i, target) => {
          const cardCenterX = target.offsetLeft + target.offsetWidth / 2;
          return centerX - cardCenterX;
        },
        y: (i, target) => {
          return -target.offsetTop - 60;
        },
        scale: 0.35,
        rotation: () => (Math.random() - 0.5) * 35
      });

      // Deal them out across the table one by one with fast tactile sound
      gsap.to(cardElements, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.35,
        stagger: {
          each: 0.035,
          onStart: function () {
            sounds.playTick(1.05);
          }
        },
        ease: 'power2.out',
        onComplete: () => {
          setIsDealing(false);
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // 2. Chocolatear / Barajar cartas con física GSAP ultrarrápida y fluida
  const handleShuffle = () => {
    if (isShuffling || isDealing || isFlippingChosen || hasRevealedChosen) return;
    setSelectedCardId(null);
    setIsShuffling(true);

    const cardElements = containerRef.current.querySelectorAll('.card-item');
    if (!cardElements.length) return;

    sounds.playShuffle();

    const parentRect = containerRef.current.getBoundingClientRect();
    const centerX = parentRect.width / 2;
    const centerY = parentRect.height / 2;

    const tl = gsap.timeline({
      onComplete: () => {
        // Randomize the labels/order of the deck
        setCardDeck((prev) => {
          const shuffled = [...prev];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        });
        setIsShuffling(false);
      }
    });

    // Step A: Gather all cards rapidly to the center into a single neat deck
    tl.to(cardElements, {
      x: (i, target) => {
        const cardCenterX = target.offsetLeft + target.offsetWidth / 2;
        return centerX - cardCenterX;
      },
      y: (i, target) => {
        const cardCenterY = target.offsetTop + target.offsetHeight / 2;
        return centerY - cardCenterY;
      },
      rotation: () => (Math.random() - 0.5) * 12,
      scale: 0.95,
      duration: 0.2,
      ease: 'power2.inOut'
    });

    // Step B: Rapid snappy riffle & interweave back and forth
    tl.to(cardElements, {
      x: (i) => (i % 2 === 0 ? '-=24' : '+=24'),
      rotation: (i) => (i % 2 === 0 ? -6 : 6),
      duration: 0.09,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: 1
    });

    // Step C: Deal cards back out to their slots smoothly
    tl.to(cardElements, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      duration: 0.28,
      stagger: {
        each: 0.025,
        onStart: () => sounds.playTick(1.2)
      },
      ease: 'power2.out'
    });
  };

  // 3. Click on a card to prepare selection
  const handleCardClick = (cardId) => {
    if (isShuffling || isDealing || isFlippingChosen || hasRevealedChosen) return;
    setSelectedCardId(cardId);
    sounds.playTick(1.2);
  };

  // 4. Confirm selection with Hand Animation ("Mano dando vuelta a la carta")
  const handleConfirmPick = async () => {
    if (!selectedCardId || isFlippingChosen || hasRevealedChosen) return;

    setError('');
    setIsHandVisible(true);

    try {
      // Pre-fetch draw result
      const drawPromise = fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      }).then((res) => {
        if (!res.ok) throw new Error('Error al sacar la carta.');
        return res.json();
      });

      // Animate hand reaching in
      await new Promise((r) => setTimeout(r, 60));
      if (handRef.current) {
        gsap.fromTo(
          handRef.current,
          { x: 70, y: 80, opacity: 0, rotate: 15 },
          { x: 0, y: 0, opacity: 1, rotate: 0, duration: 0.35, ease: 'power2.out' }
        );
      }

      const data = await drawPromise;
      const winner = data.assignedFriend;
      const others = data.otherCandidates || [];

      // Assign names to cards in deck
      setCardDeck((prevDeck) => {
        let otherIdx = 0;
        return prevDeck.map((c) => {
          if (c.id === selectedCardId) {
            return { ...c, name: winner.name, isWinner: true };
          } else {
            const otherName = others[otherIdx]?.name || 'Amigo disponible';
            otherIdx++;
            return { ...c, name: otherName, isWinner: false };
          }
        });
      });

      setAssignedFriend(winner);

      // Hand grips card edge and flips it over to the left!
      sounds.playFlip();
      setIsFlippingChosen(true);

      if (handRef.current) {
        gsap.to(handRef.current, {
          x: -110,
          y: -25,
          rotate: -28,
          duration: 0.55,
          ease: 'power2.inOut'
        });
      }

      // Once card reaches 180°, hand pulls away and reveals
      setTimeout(() => {
        if (handRef.current) {
          gsap.to(handRef.current, {
            opacity: 0,
            y: 50,
            duration: 0.25,
            onComplete: () => setIsHandVisible(false)
          });
        } else {
          setIsHandVisible(false);
        }

        setHasRevealedChosen(true);
        setIsFlippingChosen(false);
        sounds.playCelebration();

        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#090a0f', '#3b82f6', '#10b981', '#f59e0b'],
          disableForReducedMotion: true
        });

        // Shortly after, flip all the other cards so the user sees all spots
        setTimeout(() => {
          setHasRevealedOthers(true);
          sounds.playFlip();
        }, 900);
      }, 550);
    } catch (err) {
      setIsFlippingChosen(false);
      setIsHandVisible(false);
      setError(err.message);
    }
  };

  const handleCopy = () => {
    if (!assignedFriend) return;
    navigator.clipboard.writeText(assignedFriend.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[720px] mx-auto">
      <div className="sharp-card p-4 sm:p-8 space-y-5 sm:space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#e5e7eb]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#090a0f]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                Mesa de Cartas • Amigo Secreto
              </span>
            </div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-[#090a0f] mt-0.5">
              Turno de: <span className="underline decoration-neutral-300">{currentUser.name}</span>
            </h2>
          </div>

          {!hasRevealedChosen && !isFlippingChosen && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShuffle}
                disabled={isShuffling || isDealing}
                className="sharp-primary-btn px-2.5 sm:px-3.5 py-1.5 text-[9px] sm:text-[10px]"
                title="Barajar las cartas"
              >
                {isShuffling ? 'Chocolateando...' : 'Chocolatear'}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="sharp-outline-btn px-2.5 sm:px-3 py-1.5 text-[9px] sm:text-[10px]"
              >
                Cambiar
              </button>
            </div>
          )}
        </div>

        {/* Status Prompt */}
        {!hasRevealedChosen ? (
          <div className="flex items-center justify-between bg-[#f8fafc] border border-[#e5e7eb] px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-mono">
            <span className="text-neutral-700 truncate pr-2">
              {isDealing
                ? 'Repartiendo cartas...'
                : isShuffling
                ? 'Chocolateando cartas...'
                : isHandVisible
                ? 'Dando vuelta a la carta...'
                : selectedCardId
                ? `Carta ${cardDeck.find((c) => c.id === selectedCardId)?.label} seleccionada.`
                : 'Toca una carta para seleccionarla:'}
            </span>
            <span className="font-semibold text-[#090a0f] whitespace-nowrap">
              {cardDeck.length} cartas
            </span>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono text-center">
            ¡Carta revelada! Tu amigo secreto es <strong>{assignedFriend?.name}</strong>.
          </div>
        )}

        {/* The Card Table: 3 columns on mobile! */}
        <div
          ref={containerRef}
          className={`perspective-container py-1 sm:py-2 relative min-h-[280px] transition-all ${
            selectedCardId && !hasRevealedChosen ? 'pb-24 sm:pb-0' : ''
          }`}
        >
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3.5">
            {cardDeck.map((card) => {
              const isSelected = card.id === selectedCardId;
              const isCardFlipped =
                (isSelected && (isFlippingChosen || hasRevealedChosen)) ||
                (!isSelected && hasRevealedOthers);

              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`card-item relative h-32 sm:h-36 cursor-pointer select-none transition-opacity duration-150 will-change-transform ${
                    isSelected && !hasRevealedChosen
                      ? 'scale-105 sm:scale-110 -translate-y-2 z-30'
                      : !isSelected && selectedCardId && !hasRevealedChosen
                      ? 'opacity-35 grayscale-[40%]'
                      : 'hover:-translate-y-1'
                  }`}
                >
                  {/* Glowing selection badge on top */}
                  {isSelected && !hasRevealedChosen && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-black text-[8px] sm:text-[9px] font-mono font-extrabold uppercase tracking-widest px-2 py-0.5 shadow-lg z-40 whitespace-nowrap">
                      SELECCIONADA
                    </div>
                  )}

                  <div
                    className={`flip-card-inner h-full ${
                      isCardFlipped ? 'is-flipped' : ''
                    }`}
                  >
                    {/* BACK OF CARD (Face down) */}
                    <div
                      className={`flip-card-front h-full flex flex-col justify-between p-2 sm:p-3 card-back-pattern ${
                        isSelected && !hasRevealedChosen
                          ? 'card-selected-glow'
                          : ''
                      }`}
                    >
                      <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-mono text-neutral-400">
                        <span className={isSelected && !hasRevealedChosen ? 'text-amber-300 font-bold' : ''}>
                          {card.label}
                        </span>
                        <span className={`text-[7px] sm:text-[8px] uppercase tracking-widest ${
                          isSelected && !hasRevealedChosen ? 'text-amber-300 font-bold' : 'text-neutral-400'
                        }`}>
                          {isSelected && !hasRevealedChosen ? 'LISTA' : 'SECRETO'}
                        </span>
                      </div>

                      {/* Center card seal */}
                      <div className="flex flex-col items-center justify-center my-auto">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 border flex items-center justify-center transition-colors ${
                          isSelected && !hasRevealedChosen
                            ? 'border-amber-400 bg-amber-400/20 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                            : 'border-neutral-600'
                        }`}>
                          <span className={`font-mono text-[10px] sm:text-xs font-bold ${
                            isSelected && !hasRevealedChosen ? 'text-amber-300' : 'text-neutral-300'
                          }`}>
                            ?
                          </span>
                        </div>
                      </div>

                      <div className={`text-center text-[8px] sm:text-[9px] font-mono uppercase tracking-widest truncate ${
                        isSelected && !hasRevealedChosen
                          ? 'text-amber-300 font-extrabold'
                          : 'text-neutral-300'
                      }`}>
                        {isSelected && !hasRevealedChosen ? 'DAR VUELTA' : 'Elegir'}
                      </div>
                    </div>

                    {/* FRONT OF CARD (Revealed Face up) */}
                    <div
                      className={`flip-card-back h-full flex flex-col justify-between p-2 sm:p-3 bg-white border-2 ${
                        card.isWinner
                          ? 'border-[#090a0f] shadow-lg ring-2 ring-[#090a0f]'
                          : 'border-[#d1d5db] opacity-75'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[8px] sm:text-[9px] font-mono">
                        <span className="text-neutral-400">{card.label}</span>
                        <span
                          className={`font-semibold uppercase tracking-wider text-[7px] sm:text-[8px] ${
                            card.isWinner ? 'text-emerald-700' : 'text-neutral-400'
                          }`}
                        >
                          {card.isWinner ? 'TU ELECCIÓN' : 'DISPONIBLE'}
                        </span>
                      </div>

                      <div className="my-auto text-center px-0.5 sm:px-1">
                        <span className="text-[7px] sm:text-[9px] font-mono uppercase tracking-widest text-neutral-400 block mb-0.5 sm:mb-1 truncate">
                          {card.isWinner ? 'Amigo Secreto' : 'Otra carta'}
                        </span>
                        <div
                          className={`uppercase tracking-tight font-bold leading-tight break-words ${
                            card.isWinner
                              ? 'text-xs sm:text-base md:text-lg text-[#090a0f]'
                              : 'text-[10px] sm:text-xs text-neutral-600 font-medium'
                          }`}
                        >
                          {card.name || '...'}
                        </div>
                      </div>

                      <div className="text-[7px] sm:text-[8px] font-mono uppercase tracking-widest text-neutral-400 text-center truncate">
                        {card.isWinner ? 'ASIGNADO' : 'NO ELEGIDA'}
                      </div>
                    </div>
                  </div>

                  {/* Realistic hand flipping animation attached to chosen card */}
                  {isSelected && isHandVisible && (
                    <div
                      ref={handRef}
                      className="absolute -bottom-6 -right-6 w-24 h-24 sm:w-36 sm:h-36 z-50 pointer-events-none select-none"
                      style={{ transformOrigin: 'bottom right' }}
                    >
                      <img
                        src="/hand_realistic.png"
                        alt="Mano volteando la carta"
                        className="w-full h-full object-contain filter drop-shadow-[0_12px_18px_rgba(0,0,0,0.3)]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Confirmation Banner ("¿Seguro?") - Sticky at bottom on mobile, static on desktop */}
        {selectedCardId && !hasRevealedChosen && (
          <div className="fixed bottom-0 left-0 right-0 sm:static z-50 p-4 sm:p-4 bg-white/95 sm:bg-neutral-50 backdrop-blur-md sm:backdrop-blur-none border-t-2 sm:border-2 border-[#090a0f] shadow-[0_-8px_25px_rgba(0,0,0,0.15)] sm:shadow-none space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="max-w-[720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <div className="text-sm font-bold uppercase tracking-tight text-[#090a0f]">
                  ¿Seguro con la Carta {cardDeck.find((c) => c.id === selectedCardId)?.label}?
                </div>
                <div className="text-xs text-neutral-500 font-mono">
                  Una mano dará vuelta a la carta y revelará a tu amigo secreto.
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCardId(null)}
                  disabled={isFlippingChosen || isHandVisible}
                  className="sharp-outline-btn flex-1 sm:flex-initial px-4 h-11 sm:h-10 text-xs"
                >
                  Elegir otra
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPick}
                  disabled={isFlippingChosen || isHandVisible}
                  className="sharp-primary-btn flex-1 sm:flex-initial px-5 h-11 sm:h-10 text-xs"
                >
                  {isHandVisible ? 'Dando vuelta...' : 'Sí, dar vuelta'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reveal Results and Final Actions */}
        {hasRevealedChosen && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#f8fafc] border border-[#e2e8f0]">
              <div className="text-xs font-mono text-neutral-600 text-center sm:text-left">
                Tu amigo secreto es <strong>{assignedFriend?.name}</strong>. Guarda el secreto.
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="sharp-outline-btn px-4 py-2 text-[11px] w-full sm:w-auto"
              >
                {copied ? 'Copiado al portapapeles' : 'Copiar nombre'}
              </button>
            </div>

            <button
              type="button"
              onClick={onFinishAndReturn}
              className="sharp-primary-btn w-full h-12"
            >
              Listo, volver al menú principal
            </button>
          </div>
        )}

        {!hasRevealedChosen && !selectedCardId && (
          <div className="flex items-center justify-between pt-2 border-t border-[#e5e7eb] text-[10px] font-mono uppercase tracking-wider text-neutral-400">
            <span>Puedes chocolatear antes de elegir</span>
            <span>Un solo sorteo por persona</span>
          </div>
        )}
      </div>
    </div>
  );
}
