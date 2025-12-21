
import React, { useState, useEffect } from 'react';
import { AppStep, SkinAnalysis, FoundationShade, GroundingSource } from './types';
import { searchBrandShades } from './services/geminiService';
import LiveMirror from './components/LiveMirror';
import ChatInterface from './components/ChatInterface';

const FALLBACK_SHADES: FoundationShade[] = [
  { id: 'f1', name: 'Lumi Silk - Porcelain', hex: '#FDF5E6', brand: 'Lumi Essentials', buyUrl: '#' },
  { id: 'f2', name: 'Lumi Silk - Sand', hex: '#EED9C4', brand: 'Lumi Essentials', buyUrl: '#' },
  { id: 'f3', name: 'Lumi Silk - Caramel', hex: '#C68E65', brand: 'Lumi Essentials', buyUrl: '#' },
  { id: 'f4', name: 'Lumi Silk - Espresso', hex: '#3D2B1F', brand: 'Lumi Essentials', buyUrl: '#' },
];

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('welcome');
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [shades, setShades] = useState<FoundationShade[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [selectedShade, setSelectedShade] = useState<FoundationShade | null>(null);
  const [brandInput, setBrandInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchCooldown, setSearchCooldown] = useState(0);

  const startJourney = () => setStep('brand-discovery');

  useEffect(() => {
    if (searchCooldown > 0) {
      const timer = setInterval(() => setSearchCooldown(c => Math.max(0, c - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [searchCooldown]);

  const findBrandShades = async () => {
    if (!brandInput || brandInput.trim().length < 2 || isLoading || searchCooldown > 0) return;
    setIsLoading(true);
    try {
      const { shades: resultShades, sources: resultSources } = await searchBrandShades(brandInput);
      setShades(resultShades);
      setSources(resultSources);
      setSearchCooldown(15);
    } catch (err: any) {
      // If AI fails, provide the essentials so the app stays functional
      setShades(FALLBACK_SHADES);
      setSearchCooldown(30);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative selection:bg-neutral-900 selection:text-white pb-20 overflow-x-hidden">
      <div className="fixed inset-0 luxury-gradient pointer-events-none -z-10" />
      
      <nav className="p-6 flex items-center justify-between sticky top-0 bg-white/70 backdrop-blur-xl z-50 border-b border-neutral-200/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-900 flex items-center justify-center text-white font-serif text-xl shadow-lg">L</div>
          <span className="font-serif font-bold text-2xl tracking-tight text-neutral-900 uppercase">Lumière</span>
        </div>
        <button onClick={() => window.location.reload()} className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-all px-4 py-2 rounded-full border border-neutral-200">Reset Studio</button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-12">
        {step === 'welcome' && (
          <div className="flex flex-col items-center text-center space-y-16 py-24 animate-in fade-in duration-1000">
            <div className="space-y-8">
              <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-neutral-200 text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">468-Point Mesh System</div>
              <h1 className="text-6xl md:text-9xl font-serif text-neutral-900 leading-[1.1] tracking-tight">Your Skin, <br /><span className="italic font-light text-neutral-400">Perfectly Mapped.</span></h1>
              <p className="text-xl text-neutral-500 max-w-2xl mx-auto font-light leading-relaxed italic">"The magic is in the mesh. Zero latency. Infinite precision."</p>
            </div>
            <button onClick={startJourney} className="group relative px-14 py-6 bg-neutral-900 text-white rounded-full font-black text-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-500 flex items-center gap-6">Enter Studio</button>
          </div>
        )}

        {step === 'brand-discovery' && (
          <div className="grid lg:grid-cols-12 gap-16 items-start max-w-6xl mx-auto">
            <div className="lg:col-span-5 lg:sticky lg:top-32">
              <LiveMirror selectedShade={selectedShade} onAnalysisUpdate={(a) => setAnalysis(a)} />
              {analysis && (
                <div className="mt-8 p-8 bg-white rounded-[40px] border border-neutral-100 shadow-xl space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center">
                    <h3 className="font-serif text-xl text-neutral-900">Mesh Diagnosis</h3>
                    <span className="text-[8px] px-2 py-1 rounded bg-neutral-100 text-neutral-400 uppercase font-black tracking-widest">Active</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <p className="text-[9px] font-black uppercase text-neutral-400 mb-1">Tone Map</p>
                      <p className="font-bold text-neutral-900">{analysis.tone}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <p className="text-[9px] font-black uppercase text-neutral-400 mb-1">Undertone</p>
                      <p className="font-bold text-neutral-900">{analysis.undertone}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed font-medium uppercase tracking-wider">{analysis.description}</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 space-y-12">
              <section className="space-y-8">
                <h2 className="text-4xl font-serif text-neutral-900">Virtual Discovery.</h2>
                <div className="relative flex gap-4 p-3 bg-white rounded-[40px] border-2 border-neutral-100 shadow-2xl focus-within:border-neutral-900 transition-all">
                  <input 
                    type="text" 
                    value={brandInput}
                    onChange={(e) => setBrandInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && findBrandShades()}
                    placeholder="Search any luxury brand..."
                    className="flex-1 px-8 py-5 rounded-3xl bg-neutral-50 focus:bg-white focus:outline-none text-xl font-bold text-neutral-900 placeholder:text-neutral-300"
                  />
                  <button 
                    onClick={findBrandShades} 
                    disabled={brandInput.trim().length < 2 || isLoading || searchCooldown > 0} 
                    className="px-10 py-5 bg-neutral-900 text-white rounded-[30px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-20"
                  >
                    {isLoading ? '...' : searchCooldown > 0 ? `${searchCooldown}s` : 'Search'}
                  </button>
                </div>
              </section>

              {shades.length > 0 && (
                <div className="space-y-6">
                   <div className="flex items-center justify-between px-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Available Shade Matrix</h4>
                      {shades[0].brand === 'Lumi Essentials' && <span className="text-[8px] text-orange-400 font-bold uppercase tracking-widest bg-orange-50 px-2 py-1 rounded">Offline Essentials Loaded</span>}
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {shades.map((shade) => (
                      <div key={shade.id} onClick={() => setSelectedShade(shade)} className={`p-6 rounded-[32px] border-2 cursor-pointer flex items-center gap-6 transition-all duration-300 ${selectedShade?.id === shade.id ? 'border-neutral-900 bg-white shadow-xl scale-[1.02]' : 'border-transparent bg-white/60 hover:bg-white'}`}>
                        <div className="w-14 h-14 rounded-2xl shadow-inner border border-black/5" style={{ backgroundColor: shade.hex }} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-neutral-900 text-lg truncate leading-tight">{shade.name}</h4>
                          <p className="text-[10px] text-neutral-400 uppercase font-black tracking-widest mt-1">Ready for Overlay</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <ChatInterface />
    </div>
  );
};

export default App;
