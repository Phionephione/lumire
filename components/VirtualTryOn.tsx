
import React, { useRef, useEffect, useState } from 'react';
import { FoundationShade, SkinAnalysis } from '../types';

interface VirtualTryOnProps {
  image: string;
  selectedShade: FoundationShade | null;
  analysis: SkinAnalysis | null;
}

const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ image, selectedShade, analysis }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = `data:image/jpeg;base64,${image}`;
    img.onload = () => {
      const displayWidth = canvas.parentElement?.clientWidth || 500;
      const aspectRatio = img.height / img.width;
      canvas.width = displayWidth * 2; 
      canvas.height = (displayWidth * aspectRatio) * 2;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (selectedShade && !showOriginal && analysis?.landmarks) {
        ctx.save();
        
        const l = analysis.landmarks;
        const pts = {
          forehead: [l.forehead_center[0] * canvas.width / 100, l.forehead_center[1] * canvas.height / 100],
          l_temple: [l.left_temple[0] * canvas.width / 100, l.left_temple[1] * canvas.height / 100],
          r_temple: [l.right_temple[0] * canvas.width / 100, l.right_temple[1] * canvas.height / 100],
          l_jaw: [l.left_jaw[0] * canvas.width / 100, l.left_jaw[1] * canvas.height / 100],
          r_jaw: [l.right_jaw[0] * canvas.width / 100, l.right_jaw[1] * canvas.height / 100],
          chin: [l.chin_tip[0] * canvas.width / 100, l.chin_tip[1] * canvas.height / 100],
          l_eye: [l.left_eye[0] * canvas.width / 100, l.left_eye[1] * canvas.height / 100],
          r_eye: [l.right_eye[0] * canvas.width / 100, l.right_eye[1] * canvas.height / 100],
          mouth: [l.mouth_center[0] * canvas.width / 100, l.mouth_center[1] * canvas.height / 100]
        };

        // 1. CREATE CUSTOM FACE POLYGON (Skin only, no hair/head)
        ctx.beginPath();
        ctx.moveTo(pts.forehead[0], pts.forehead[1]);
        ctx.bezierCurveTo(pts.l_temple[0], pts.l_temple[1], pts.l_jaw[0], pts.l_jaw[1] - 50, pts.l_jaw[0], pts.l_jaw[1]);
        ctx.lineTo(pts.chin[0], pts.chin[1]);
        ctx.lineTo(pts.r_jaw[0], pts.r_jaw[1]);
        ctx.bezierCurveTo(pts.r_jaw[0], pts.r_jaw[1] - 50, pts.r_temple[0], pts.r_temple[1], pts.forehead[0], pts.forehead[1]);
        ctx.closePath();
        
        // 2. EXCLUDE EYES AND MOUTH (Avoids the "all over" look)
        const eyeRadius = canvas.width * 0.04;
        const mouthRadiusW = canvas.width * 0.08;
        const mouthRadiusH = canvas.width * 0.03;

        // Left Eye Hole
        ctx.moveTo(pts.l_eye[0] + eyeRadius, pts.l_eye[1]);
        ctx.arc(pts.l_eye[0], pts.l_eye[1], eyeRadius, 0, Math.PI * 2, true);
        
        // Right Eye Hole
        ctx.moveTo(pts.r_eye[0] + eyeRadius, pts.r_eye[1]);
        ctx.arc(pts.r_eye[0], pts.r_eye[1], eyeRadius, 0, Math.PI * 2, true);

        // Mouth Hole
        ctx.moveTo(pts.mouth[0] + mouthRadiusW, pts.mouth[1]);
        ctx.ellipse(pts.mouth[0], pts.mouth[1], mouthRadiusW, mouthRadiusH, 0, 0, Math.PI * 2, true);

        ctx.clip();

        // 3. APPLY NATURAL PRODUCT BLEND
        // Using Soft Light + Hue for transparency and realism
        ctx.globalCompositeOperation = 'soft-light';
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = selectedShade.hex;
        ctx.fill();

        ctx.globalCompositeOperation = 'hue';
        ctx.globalAlpha = 0.3;
        ctx.fill();
        
        ctx.restore();
      }
    };
  }, [image, selectedShade, analysis, showOriginal]);

  return (
    <div className="relative group rounded-[40px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-[6px] border-white bg-white p-1 transition-all">
      <div className="relative rounded-[32px] overflow-hidden bg-neutral-100 aspect-[4/5] md:aspect-[3/4]">
        <canvas ref={canvasRef} className="w-full h-full object-cover" />
        
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.1)] rounded-[32px]" />
        
        {selectedShade && (
          <button 
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            className="absolute bottom-8 right-8 px-5 py-3 bg-black/80 backdrop-blur-xl text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl z-20"
          >
            Compare Original
          </button>
        )}

        {selectedShade && (
          <div className="absolute top-8 left-8 bg-white/95 backdrop-blur-3xl px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-5 border border-neutral-100">
            <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: selectedShade.hex }} />
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-black tracking-widest leading-none mb-1">Applied</p>
              <p className="text-base font-black text-neutral-900 leading-tight">{selectedShade.name}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualTryOn;
