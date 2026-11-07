'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

// Helper to load image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

// Canvas-based rotation and crop extraction
async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of rotated image
  const { width: bBoxWidth, height: bBoxHeight } = {
    width: Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height),
    height: Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height)
  };

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas center to image center and rotate
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  // Now create output canvas for the cropped circular avatar
  const outputCanvas = document.createElement('canvas');
  const outputSize = 280; // Crisp avatar resolution
  outputCanvas.width = outputSize;
  outputCanvas.height = outputSize;
  const outCtx = outputCanvas.getContext('2d');

  if (!outCtx) return null;

  // Circular clip for clean edges
  outCtx.beginPath();
  outCtx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  outCtx.closePath();
  outCtx.clip();

  // Draw the cropped portion from the rotated canvas
  outCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return outputCanvas.toDataURL('image/jpeg', 0.88);
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  participantName,
  onSave,
  onClose
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setIsProcessing(true);
    try {
      const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (croppedBase64) {
        onSave(croppedBase64);
      }
    } catch (err) {
      console.error('Error cropping image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[420px] bg-white border border-[#090a0f] shadow-2xl p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#e5e7eb]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#090a0f]">
              Recortar y centrar foto
            </h3>
            <span className="text-[11px] font-mono text-neutral-500">
              {participantName}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-black font-mono text-sm px-1.5 py-0.5"
          >
            [X]
          </button>
        </div>

        {/* Interactive Cropper Box */}
        <div className="relative w-full h-72 bg-neutral-950 overflow-hidden select-none">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 px-2.5 py-0.5 text-[9px] font-mono text-white/90 pointer-events-none uppercase tracking-wider">
            Arrastra o pellizca para centrar
          </div>
        </div>

        {/* Controls: Zoom & Rotate */}
        <div className="space-y-3 pt-1">
          {/* Zoom */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 uppercase">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-400">-</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[#090a0f] cursor-pointer h-1.5 bg-neutral-200 rounded-none"
              />
              <span className="text-xs font-mono text-neutral-400">+</span>
            </div>
          </div>

          {/* Rotate Button */}
          <div className="flex justify-between items-center pt-1 border-t border-[#f1f2f4]">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">
              Orientación
            </span>
            <button
              type="button"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="text-[10px] font-mono uppercase px-2.5 py-1 border border-neutral-300 hover:border-black bg-neutral-50 text-neutral-700 transition-colors"
            >
              Rotar 90°
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-[#e5e7eb]">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="sharp-outline-btn flex-1 h-10 text-[11px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="sharp-primary-btn flex-1 h-10 text-[11px]"
          >
            {isProcessing ? 'Guardando...' : 'Aplicar recorte'}
          </button>
        </div>
      </div>
    </div>
  );
}
