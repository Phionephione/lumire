
import React, { useRef, useEffect, useState } from 'react';
import { trackFaceLive } from '../services/geminiService';
import { FoundationShade, SkinAnalysis } from '../types';

interface LiveMirrorProps {
  selectedShade: FoundationShade | null;
  onAnalysisUpdate: (analysis: SkinAnalysis) => void;
}

const LiveMirror: React.FC<LiveMirrorProps> = ({ selectedShade, onAnalysisUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState(false);
  const lastAnalysis = useRef<SkinAnalysis | null>(null);

  // 1. Initialize Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user', 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Auto-play failed", e));
          setHasCamera(true);
        }
      } catch (err) {
        console.error("Camera access failed", err);
        setError("Please enable camera access to use the Live Mirror.");
      }
    };

    startCam();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  // 2. Tracking Heartbeat (Send frame to AI)
  // frequency reduced to 8 seconds to stay well within free-tier rate limits (approx 7-8 RPM)
  useEffect(() => {
    let timeoutId: number;
    
    const runTracking = async () => {
      const video = videoRef.current;
      if (!video || video.readyState !== 4) {
        timeoutId = window.setTimeout(runTracking, 1000);
        return;
      }
      
      setIsTracking(true);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 300;
      tempCanvas.height = (video.videoHeight / video.videoWidth) * 300;
      
      const tCtx = tempCanvas.getContext('2d');
      if (tCtx) {
        tCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        const base64 = tempCanvas.toDataURL('image/jpeg', 0.5).split(',')[1];
        try {
          const result = await trackFaceLive(base64);
          lastAnalysis.current = result;
          onAnalysisUpdate(result);
          setQuotaError(false);
        } catch (e: any) {
          console.error("AI Tracking Error:", e);
          if (e.message?.includes('429') || e.message?.includes('quota')) {
            setQuotaError(true);
          }
        }
      }
      setIsTracking(false);
      // Schedule next run in 8 seconds
      timeoutId = window.setTimeout(runTracking, 8000);
    };

    timeoutId = window.setTimeout(runTracking, 2000);
    return () => clearTimeout(timeoutId);
  }, [onAnalysisUpdate]);

  // 3. 60FPS Render Loop
  useEffect(() => {
    let animationId: number;
    
    const render = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== 4) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      if (selectedShade && lastAnalysis.current?.landmarks) {
        const l = lastAnalysis.current.landmarks;
        ctx.save();
        
        const mapX = (x: number) => (100 - x) * canvas.width / 100;
        const mapY = (y: number) => y * canvas.height / 100;

        ctx.beginPath();
        ctx.moveTo(mapX(l.forehead[0][0]), mapY(l.forehead[0][1]));
        l.forehead.forEach(p => ctx.lineTo(mapX(p[0]), mapY(p[1])));
        l.jawline.forEach(p => ctx.lineTo(mapX(p[0]), mapY(p[1])));
        ctx.closePath();

        const eyeR = canvas.width * 0.04;
        const mouthRW = canvas.width * 0.08;
        const mouthRH = canvas.width * 0.03;

        const drawHole = (cx: number, cy: number, rx: number, ry: number) => {
          ctx.moveTo(cx + rx, cy);
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2, true);
        };

        drawHole(mapX(l.left_eye[0]), mapY(l.left_eye[1]), eyeR, eyeR);
        drawHole(mapX(l.right_eye[0]), mapY(l.right_eye[1]), eyeR, eyeR);
        drawHole(mapX(l.mouth[0]), mapY(l.mouth[1]), mouthRW, mouthRH);

        ctx.clip();

        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = selectedShade.hex;
        ctx.globalAlpha = 0.85;
        ctx.fill();

        ctx.globalCompositeOperation = 'hue';
        ctx.globalAlpha = 0.35;
        ctx.fill();

        ctx.restore();
      }

      if (isTracking) {
        ctx.save();
        const time = Date.now() / 1000;
        const scanY = (Math.sin(time * 3) + 1) / 2 * canvas.height;
        const gradient = ctx.createLinearGradient(0, scanY - 50, 0, scanY + 50);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, scanY - 50, canvas.width, 100);
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [selectedShade, isTracking]);

  if (error) {
    return (
      <div className="relative w-full aspect-[4/5] rounded-[40px] flex items-center justify-center bg-neutral-900 border-[6px] border-white shadow-2xl p-12 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-white font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/5] rounded-[40px] overflow-hidden border-[6px] border-white shadow-2xl bg-black group transition-all duration-500">
      <video 
        ref={videoRef} 
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} 
        autoPlay 
        playsInline 
        muted 
      />
      
      {!hasCamera && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      <canvas ref={canvasRef} className="w-full h-full object-cover" />
      
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.4)]" />

      {/* HUD ELEMENTS */}
      <div className="absolute inset-0 p-8 flex flex-col justify-between pointer-events-none">
        <div className="flex justify-between items-start">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-3xl border border-white/20 transition-all ${isTracking ? 'bg-white/20' : 'bg-black/40'}`}>
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-orange-400 animate-ping' : 'bg-green-400'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
              {isTracking ? 'AI SYNCING' : 'LUMI LIVE'}
            </span>
          </div>
          
          {selectedShade && (
             <div className="bg-white/95 backdrop-blur-3xl px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-white">
                <div className="w-8 h-8 rounded-full shadow-inner border border-black/5" style={{ backgroundColor: selectedShade.hex }} />
                <div className="pr-2">
                    <p className="text-[9px] text-neutral-400 uppercase font-black tracking-widest leading-none mb-1">Applied</p>
                    <p className="text-xs font-black text-neutral-900 leading-tight uppercase">{selectedShade.name}</p>
                </div>
            </div>
          )}
        </div>

        {quotaError && (
          <div className="self-center bg-red-500/90 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest backdrop-blur-md animate-pulse">
            Rate Limit Reached - Retrying...
          </div>
        )}
        
        <div className="flex justify-center">
            <div className="px-5 py-2.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10">
                <p className="text-[9px] text-white/60 font-medium uppercase tracking-[0.3em]">AI Facial Mapping Active</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMirror;
