'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  participantName,
  onSave,
  onClose
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef(null);

  // Reset state when a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      };
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Crop image using HTML5 Canvas
  const handleConfirmCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const CROP_SIZE = 260; // Output dimension (260x260px)
    const VIEWPORT_SIZE = 240; // Diameter of preview circle
    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d');

    // Calculate displayed dimensions of the image in the container
    const rect = img.getBoundingClientRect();
    const scaleFactor = CROP_SIZE / VIEWPORT_SIZE;

    // Center coordinates
    const centerX = CROP_SIZE / 2;
    const centerY = CROP_SIZE / 2;

    ctx.save();
    // Circular clipping
    ctx.beginPath();
    ctx.arc(centerX, centerY, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    // Fill white background in case of edge
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Apply translations & scaling
    ctx.translate(centerX + pan.x * scaleFactor, centerY + pan.y * scaleFactor);
    ctx.scale(zoom, zoom);

    // Draw the image centered
    const baseW = rect.width / zoom;
    const baseH = rect.height / zoom;
    ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
    ctx.restore();

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
    onSave(croppedBase64);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[380px] bg-white border border-[#090a0f] shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e5e7eb]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#090a0f]">
              Ajustar foto
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">
              {participantName}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-black font-mono text-sm px-1"
          >
            [X]
          </button>
        </div>

        {/* Cropping Viewport */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-64 bg-neutral-900 overflow-hidden flex items-center justify-center cursor-move select-none"
        >
          {/* Draggable image */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Para recortar"
            draggable={false}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.05s ease-out',
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain'
            }}
          />

          {/* Circular Mask Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              className="w-48 h-48 rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
              style={{ pointerEvents: 'none' }}
            />
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 px-2 py-0.5 text-[9px] font-mono text-white/80 pointer-events-none uppercase tracking-wider">
            Arrastra para centrar
          </div>
        </div>

        {/* Zoom Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 uppercase">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-400">-</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-[#090a0f] cursor-pointer h-1.5 bg-neutral-200 rounded-none"
            />
            <span className="text-xs font-mono text-neutral-400">+</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-[#e5e7eb]">
          <button
            type="button"
            onClick={onClose}
            className="sharp-outline-btn flex-1 h-10 text-[10px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmCrop}
            className="sharp-primary-btn flex-1 h-10 text-[10px]"
          >
            Guardar foto
          </button>
        </div>
      </div>
    </div>
  );
}
