
import React, { useRef, useState, useEffect } from 'react';

interface CameraModuleProps {
  onCapture: (base64: string) => void;
  onCancel: () => void;
}

const CameraModule: React.FC<CameraModuleProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 1280, height: 720 } 
        });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        setError("Unable to access camera. Please check permissions.");
      }
    };
    startCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        onCapture(base64);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="relative max-w-2xl w-full aspect-video bg-neutral-900 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-white text-center p-8">
            <p className="font-light">{error}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            
            {/* FACIAL SHAPE OVERLAY GUIDE */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* This div acts as a mask/vignette with a clear facial cutout */}
              <div className="w-[40%] aspect-[1/1.35] border-2 border-white/40 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] relative">
                <div className="absolute inset-[-2px] border border-white/10 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] animate-pulse"></div>
                
                {/* Visual cues for eyes and mouth alignment */}
                <div className="absolute top-[35%] left-0 right-0 flex justify-around px-4 opacity-20">
                    <div className="w-4 h-1 bg-white rounded-full"></div>
                    <div className="w-4 h-1 bg-white rounded-full"></div>
                </div>
                <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full opacity-20"></div>
              </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2">
                <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full">
                  Align face within guide
                </p>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-10 flex gap-6 items-center">
        <button 
          onClick={onCancel}
          className="px-8 py-3 rounded-full text-neutral-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
        >
          Cancel
        </button>
        <button 
          onClick={handleCapture}
          className="group relative px-12 py-4 bg-white text-black font-black text-sm uppercase tracking-[0.2em] rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
        >
          Capture Analysis
          <div className="absolute inset-0 rounded-full border border-white group-hover:scale-110 opacity-0 group-hover:opacity-100 transition-all"></div>
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraModule;
