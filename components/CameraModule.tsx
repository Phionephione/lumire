
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
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="relative max-w-2xl w-full aspect-video bg-neutral-800 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-white text-center p-8">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-4 border-white/20 rounded-full scale-[0.6] pointer-events-none flex items-center justify-center">
              <div className="w-full h-full border border-white/40 rounded-full animate-pulse"></div>
            </div>
            <p className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm font-light">
              Align your face within the circle
            </p>
          </>
        )}
      </div>
      
      <div className="mt-8 flex gap-6">
        <button 
          onClick={onCancel}
          className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-md"
        >
          Cancel
        </button>
        <button 
          onClick={handleCapture}
          className="px-10 py-3 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition-all duration-300 shadow-xl"
        >
          Capture Analysis
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraModule;
