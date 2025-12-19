
import React, { useRef, useEffect } from 'react';
import { FoundationShade } from '../types';

interface VirtualTryOnProps {
  image: string;
  selectedShade: FoundationShade | null;
}

const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ image, selectedShade }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = `data:image/jpeg;base64,${image}`;
    img.onload = () => {
      // High-quality canvas scaling
      const displayWidth = canvas.parentElement?.clientWidth || 500;
      const aspectRatio = img.height / img.width;
      canvas.width = displayWidth * 2; // Supersampling
      canvas.height = (displayWidth * aspectRatio) * 2;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (selectedShade) {
        ctx.save();
        
        // Multi-layer blending for "Elegant Skin" look
        
        // 1. Color Multiply layer for depth
        ctx.globalCompositeOperation = 'multiply';
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.45;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.1, centerX, centerY, radius);
        gradient.addColorStop(0, selectedShade.hex);
        gradient.addColorStop(0.7, selectedShade.hex + '99');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.25;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Soft Light layer for realism
        ctx.globalCompositeOperation = 'soft-light';
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = selectedShade.hex;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 3. Highlight/Luminance layer
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 50, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    };
  }, [image, selectedShade]);

  return (
    <div className="relative group rounded-[40px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-white/50 bg-white p-2">
      <div className="relative rounded-[36px] overflow-hidden bg-neutral-50 aspect-[4/5] md:aspect-[3/4]">
        <canvas ref={canvasRef} className="w-full h-full object-cover" />
        
        <div className="absolute inset-0 pointer-events-none border-[12px] border-white/5 rounded-[36px]" />
        
        {!selectedShade && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="px-6 py-3 bg-white/40 backdrop-blur-2xl rounded-full border border-white/40 shadow-xl">
              <p className="text-neutral-900 text-[10px] font-bold uppercase tracking-[0.2em]">Select a shade to preview</p>
            </div>
          </div>
        )}

        {selectedShade && (
          <div className="absolute top-8 left-8 bg-white/80 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-left-4 duration-500 border border-white">
            <div className="w-8 h-8 rounded-xl shadow-inner border border-black/5" style={{ backgroundColor: selectedShade.hex }} />
            <div>
              <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">Live Trial</p>
              <p className="text-sm font-bold text-neutral-900 leading-tight">{selectedShade.name}</p>
            </div>
          </div>
        )}
        
        {/* Subtle texture overlay for "Photography" feel */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')]" />
      </div>
    </div>
  );
};

export default VirtualTryOn;
