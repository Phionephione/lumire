
import React, { useState } from 'react';
import { AppStep, SkinAnalysis, FoundationShade, GroundingSource } from './types';
import { searchBrandShades } from './services/geminiService';
import LiveMirror from './components/LiveMirror';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('welcome');
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [shades, setShades] = useState<FoundationShade[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [selectedShade, setSelectedShade] = useState<FoundationShade | null>(null);
  const [brandInput, setBrandInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const startJourney = () => setStep('brand-discovery');

  const findBrandShades = async () => {
    if (!brandInput) return;
    setIsLoading(true);
    try {
      const { shades: resultShades, sources: resultSources } = await searchBrandShades(brandInput);
      setShades(resultShades);
      setSources(resultSources);
    } catch (err) {
      console.error(err);
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
          <span className="font-serif font-bold text-2xl tracking-tight text-neutral-900">LUMIÈRE</span>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-all px-4 py-2 rounded-full border border-neutral-200"
        >
          Reset
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-12">
        {step === 'welcome' && (
          <div className="flex flex-col items-center text-center space-y-16 py-24">
            <div className="space-y-8">
              <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-neutral-200 text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">
                Live AI Beauty Mirror
              </div>
              <h1 className="text-6xl md:text-9xl font-serif text-neutral-900 leading-[1.1] tracking-tight">
                Your Skin, <br />
                <span className="italic font-light">Only Better.</span>
              </h1>
              <p className="text-xl text-neutral-500 max-w-2xl mx-auto font-light leading-relaxed">
                Step into the future of beauty. Enter a brand, select your shade, and watch as Lumière's live AI applies it to your face with surgical precision.
              </p>
            </div>
            
            <button 
              onClick={startJourney}
              className="group relative px-14 py-6 bg-neutral-900 text-white rounded-full font-bold text-xl hover:shadow-2xl transition-all duration-500 flex items-center gap-6"
            >
              Enter the Studio
              <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        )}

        {step === 'brand-discovery' && (
          <div className="grid lg:grid-cols-12 gap-16 items-start max-w-6xl mx-auto">
            {/* Live Mirror Column */}
            <div className="lg:col-span-5 lg:sticky lg:top-32">
              <LiveMirror 
                selectedShade={selectedShade} 
                onAnalysisUpdate={(a) => setAnalysis(a)} 
              />
              
              {analysis && (
                <div className="mt-8 p-8 bg-white rounded-[40px] border border-neutral-100 shadow-xl space-y-6 animate-in fade-in slide-in-from-left-6">
                  <h3 className="font-serif text-2xl text-neutral-900">Live Diagnostics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1">Detected Tone</p>
                      <p className="font-bold text-neutral-900">{analysis.tone}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1">Undertone</p>
                      <p className="font-bold text-neutral-900">{analysis.undertone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Discovery Column */}
            <div className="lg:col-span-7 space-y-12">
              <section className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-5xl font-serif text-neutral-900 tracking-tight">Search any brand.</h2>
                  <p className="text-neutral-500 font-light text-lg">We'll scrape the web to find every authentic shade they offer.</p>
                </div>
                
                <div className="relative flex gap-4 p-3 bg-white rounded-[40px] border-2 border-neutral-100 shadow-2xl focus-within:border-neutral-900 transition-all">
                  <input 
                    type="text" 
                    value={brandInput}
                    onChange={(e) => setBrandInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && findBrandShades()}
                    placeholder="Dior, Fenty, Estée Lauder..."
                    className="flex-1 px-8 py-5 rounded-3xl bg-neutral-50 focus:bg-white focus:outline-none text-xl font-bold text-neutral-900"
                  />
                  <button 
                    onClick={findBrandShades}
                    disabled={!brandInput || isLoading}
                    className="px-10 py-5 bg-neutral-900 text-white rounded-[30px] font-black text-sm uppercase tracking-widest hover:bg-black transition-all disabled:opacity-30"
                  >
                    {isLoading ? 'Scraping...' : 'Discovery'}
                  </button>
                </div>
              </section>

              {shades.length > 0 && (
                <section className="space-y-8 animate-in fade-in slide-in-from-bottom-6">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-6">
                    <h3 className="text-3xl font-serif text-neutral-900">{brandInput} Catalog</h3>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Select to Try On</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {shades.map((shade) => (
                      <div 
                        key={shade.id}
                        onClick={() => setSelectedShade(shade)}
                        className={`p-6 rounded-[32px] border-2 transition-all cursor-pointer flex items-center gap-6 ${
                          selectedShade?.id === shade.id 
                            ? 'border-neutral-900 bg-white shadow-2xl scale-[1.05]' 
                            : 'border-transparent bg-white/60 hover:bg-white hover:border-neutral-100'
                        }`}
                      >
                        <div className="w-16 h-16 rounded-2xl shadow-inner border border-black/5" style={{ backgroundColor: shade.hex }} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-neutral-900 text-lg truncate">{shade.name}</h4>
                          <div className="mt-3 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${selectedShade?.id === shade.id ? 'bg-green-500 animate-pulse' : 'bg-neutral-200'}`} />
                            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-tighter">Live Preview Ready</span>
                          </div>
                        </div>
                        {selectedShade?.id === shade.id && (
                            <a href={shade.buyUrl} target="_blank" rel="noopener noreferrer" className="p-4 bg-neutral-900 text-white rounded-2xl hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </a>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
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
