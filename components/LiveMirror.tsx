
import React, { useRef, useEffect, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { trackFaceLive } from '../services/geminiService';
import { FoundationShade, SkinAnalysis } from '../types';

// The Grid: Precise indices for MediaPipe 468 Face Mesh
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const CHEEK_L = 205;
const CHEEK_R = 425;

interface LiveMirrorProps {
  selectedShade: FoundationShade | null;
  onAnalysisUpdate: (analysis: SkinAnalysis) => void;
}

const LiveMirror: React.FC<LiveMirrorProps> = ({ selectedShade, onAnalysisUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [quotaCooldown, setQuotaCooldown] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  useEffect(() => {
    const initLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 1
        });
        setIsLoaded(true);
      } catch (err) {
        console.error("Landmarker init failed", err);
      }
    };
    initLandmarker();
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Play failed", e));
          setPermissionState('granted');
        };
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setPermissionState('denied');
      setCameraError(err.name === 'NotAllowedError' ? "Camera permission denied" : err.message);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const performLocalScan = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker || video.readyState < 2) return;

    const results = landmarker.detectForVideo(video, performance.now());
    if (results.faceLandmarks?.[0]) {
      const p = results.faceLandmarks[0][CHEEK_L];
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const pixel = ctx.getImageData(p.x * canvas.width, p.y * canvas.height, 1, 1).data;
        const hex = "#" + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);
        
        const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
        const tone = brightness > 200 ? 'Fair' : brightness > 150 ? 'Light-Medium' : brightness > 100 ? 'Medium-Deep' : 'Deep';
        
        onAnalysisUpdate({
          tone,
          undertone: pixel[0] > pixel[2] ? 'Warm' : 'Cool',
          description: `Locally sampled tone detected at ${hex}. Matching shades...`,
          landmarks: null as any
        });
      }
    }
  };

  const triggerExpertAIAnalysis = async () => {
    const video = videoRef.current;
    if (!video || isScanning || quotaCooldown > 0 || video.readyState < 2) return;
    setIsScanning(true);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400; tempCanvas.height = 300;
    const tCtx = tempCanvas.getContext('2d');
    if (tCtx) {
      tCtx.drawImage(video, 0, 0, 400, 300);
      try {
        const result = await trackFaceLive(tempCanvas.toDataURL('image/jpeg', 0.5).split(',')[1]);
        onAnalysisUpdate(result);
      } catch (e: any) {
        setQuotaCooldown(60);
        performLocalScan();
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    let animationId: number;
    const render = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;
      
      if (!video || !canvas || !landmarker || video.readyState < 1) {
        animationId = requestAnimationFrame(render);
        return;
      }
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      const results = landmarker.detectForVideo(video, performance.now());
      if (results.faceLandmarks?.[0]) {
        const points = results.faceLandmarks[0];
        const w = canvas.width;
        const h = canvas.height;
        const mapX = (p: any) => (1 - p.x) * w;
        const mapY = (p: any) => p.y * h;

        if (!selectedShade || showGrid) {
          ctx.beginPath();
          ctx.strokeStyle = selectedShade ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 0.5;
          results.faceLandmarks[0].forEach((p, i) => {
            if (i % 12 === 0) {
               ctx.moveTo(mapX(p), mapY(p));
               ctx.arc(mapX(p), mapY(p), 0.5, 0, Math.PI * 2);
            }
          });
          ctx.stroke();
        }

        if (selectedShade) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(mapX(points[FACE_OVAL[0]]), mapY(points[FACE_OVAL[0]]));
          FACE_OVAL.forEach(idx => ctx.lineTo(mapX(points[idx]), mapY(points[idx])));
          ctx.closePath();
          
          const clipPath = (indices: number[]) => {
            ctx.moveTo(mapX(points[indices[0]]), mapY(points[indices[0]]));
            indices.slice(1).forEach(idx => ctx.lineTo(mapX(points[idx]), mapY(points[idx])));
            ctx.closePath();
          };

          clipPath([...LEFT_EYE].reverse());
          clipPath([...RIGHT_EYE].reverse());
          clipPath([...LIPS_OUTER].reverse());
          ctx.clip('evenodd');

          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = selectedShade.hex;
          ctx.globalAlpha = 0.25;
          ctx.fill();

          ctx.globalCompositeOperation = 'soft-light';
          ctx.globalAlpha = 0.7;
          ctx.fill();
          ctx.restore();
        }
      }
      animationId = requestAnimationFrame(render);
    };
    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [selectedShade, showGrid]);

  return (
    <div className="relative w-full aspect-[4/5] rounded-[40px] overflow-hidden border-[6px] border-white shadow-2xl bg-neutral-900">
      <video 
        ref={videoRef} 
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} 
        autoPlay 
        playsInline 
        muted 
      />
      <canvas ref={canvasRef} className="w-full h-full object-cover" />
      
      {permissionState !== 'granted' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-neutral-900/90 backdrop-blur-md z-50">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10">
            <svg className="w-10 h-10 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-white font-serif text-2xl mb-3">Enable Studio View</h3>
          <p className="text-neutral-400 text-sm mb-10 max-w-[240px] leading-relaxed">Please allow camera access to start your 3D mesh trial experience.</p>
          <button 
            onClick={startCamera}
            className="px-10 py-5 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl pointer-events-auto"
          >
            Grant Access
          </button>
          {cameraError && <p className="mt-6 text-red-400 text-[10px] font-bold uppercase tracking-widest">{cameraError}</p>}
        </div>
      )}

      <div className="absolute inset-0 p-8 flex flex-col justify-between items-center pointer-events-none">
        <div className="w-full flex justify-between items-start">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-3xl bg-black/40 border border-white/20">
            <div className={`w-2 h-2 rounded-full ${!isLoaded ? 'bg-neutral-500' : 'bg-green-400 animate-pulse'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">468-PT GRID ACTIVE</span>
          </div>
          <button 
            onClick={() => setShowGrid(!showGrid)}
            className="pointer-events-auto w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white text-[10px] font-black"
          >
            {showGrid ? 'M' : 'G'}
          </button>
        </div>

        {!selectedShade && isLoaded && permissionState === 'granted' && (
          <div className="flex flex-col gap-3 items-center">
            <button 
              onClick={performLocalScan}
              className="pointer-events-auto px-10 py-5 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
            >
              Instant Mesh Scan
            </button>
            <button 
              onClick={triggerExpertAIAnalysis}
              disabled={quotaCooldown > 0 || isScanning}
              className="pointer-events-auto text-[10px] text-white/50 hover:text-white uppercase tracking-widest font-bold disabled:opacity-20 transition-all"
            >
              {quotaCooldown > 0 ? `AI Cooling (${quotaCooldown}s)` : 'Deep AI Analysis'}
            </button>
          </div>
        )}

        <div className="w-full flex justify-center">
          <div className="px-5 py-2.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 flex items-center gap-3">
            <p className="text-[9px] text-white/60 font-black uppercase tracking-[0.3em]">
              {selectedShade ? `Anchor: ${selectedShade.name}` : 'Scanning Surfaces...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMirror;
