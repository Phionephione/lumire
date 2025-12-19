
import React, { useState } from 'react';
import { AppStep, SkinAnalysis, FoundationShade, GroundingSource } from './types';
import { analyzeFaceImage, searchBrandShades } from './services/geminiService';
import CameraModule from './components/CameraModule';
import VirtualTryOn from './components/VirtualTryOn';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('welcome');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [shades, setShades] = useState<FoundationShade[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [selectedShade, setSelectedShade] = useState<FoundationShade | null>(null);
  const [brandInput, setBrandInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const startJourney = () => setStep('capture');

  const onCapture = async (base64: string) => {
    setCapturedImage(base64);
    setStep('analyze');
    setIsLoading(true);
    try {
      const result = await analyzeFaceImage(base64);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const findBrandShades = async () => {
    if (!brandInput || !analysis) return;
    setIsLoading(true);
    try {
      const { shades: resultShades, sources: resultSources } = await searchBrandShades(brandInput, analysis);
      setShades(resultShades);
      setSources(resultSources);
      setStep('shade-select');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative selection:bg-neutral-900 selection:text-white pb-20 overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 luxury-gradient pointer-events-none -z-10" />
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-neutral-200/30 blur-[150px] rounded-full" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-orange-100/40 blur-[130px] rounded-full" />

      {/* Elegant Nav */}
      <nav className="p-4 md:p-6 flex items-center justify-between sticky top-0 bg-white/60 backdrop-blur-xl z-50 border-b border-neutral-100/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-900 flex items-center justify-center text-white font-serif text-xl shadow-lg">L</div>
          <span className="font-serif font-bold text-xl md:text-2xl tracking-tight text-neutral-900">LUMIÈRE</span>
        </div>
        <div className="hidden lg:flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
          <button className="hover:text-neutral-900 transition-colors border-b-2 border-transparent hover:border-neutral-900 pb-1">Foundation</button>
          <button className="hover:text-neutral-900 transition-colors border-b-2 border-transparent hover:border-neutral-900 pb-1">Skin Concierge</button>
          <button className="hover:text-neutral-900 transition-colors border-b-2 border-transparent hover:border-neutral-900 pb-1">Our Ethics</button>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-all px-4 py-2 rounded-full border border-neutral-200 hover:border-neutral-900"
        >
          Reset Session
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-12">
        {step === 'welcome' && (
          <div className="flex flex-col items-center text-center space-y-16 py-12 md:py-24">
            <div className="space-y-8">
              <div className="inline-block px-4 py-1.5 rounded-full bg-white/50 border border-white/60 text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400 animate-pulse">
                Revolutionizing Beauty Technology
              </div>
              <h1 className="text-5xl md:text-8xl lg:text-9xl font-serif text-neutral-900 max-w-5xl leading-[1.1] tracking-tight">
                Flawless Skin, <br />
                <span className="italic font-light">Scientifically Matched.</span>
              </h1>
              <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto font-light leading-relaxed">
                Meet Lumière, your private beauty consultant powered by Gemini AI. Discover authentic foundation shades from world-class brands, matched perfectly to your unique skin profile.
              </p>
            </div>
            
            <button 
              onClick={startJourney}
              className="group relative px-10 md:px-14 py-5 md:py-6 bg-neutral-900 text-white rounded-full font-bold text-lg md:text-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:-translate-y-1 active:translate-y-0 transition-all duration-500 flex items-center gap-6"
            >
              Start Experience
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </button>

            <div className="w-full max-w-5xl grid md:grid-cols-3 gap-8 md:gap-12 mt-12 p-8 md:p-12 bg-white/30 backdrop-blur-md rounded-[40px] md:rounded-[50px] border border-white/50 shadow-sm">
                <div className="space-y-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl font-serif shadow-sm">01</div>
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-900">Digital Scan</h4>
                    <p className="text-neutral-500 text-sm leading-relaxed">High-precision facial analysis to detect depth, tone, and undertone with AI.</p>
                </div>
                <div className="space-y-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl font-serif shadow-sm">02</div>
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-900">Brand Discovery</h4>
                    <p className="text-neutral-500 text-sm leading-relaxed">Search thousands of real shades from premium brands worldwide in real-time.</p>
                </div>
                <div className="space-y-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl font-serif shadow-sm">03</div>
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-900">Virtual Try-On</h4>
                    <p className="text-neutral-500 text-sm leading-relaxed">See the foundation applied seamlessly to your face before you buy.</p>
                </div>
            </div>
          </div>
        )}

        {step === 'capture' && (
          <CameraModule onCapture={onCapture} onCancel={() => setStep('welcome')} />
        )}

        {(step === 'analyze' || step === 'brand-select' || step === 'shade-select') && (
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start pb-24">
            {/* Left Column: The Preview */}
            <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-32 order-2 lg:order-1">
              <VirtualTryOn image={capturedImage || ''} selectedShade={selectedShade} />
              
              {analysis && (
                <div className="p-8 bg-white/70 backdrop-blur-xl rounded-[40px] border border-white shadow-2xl space-y-6 animate-in fade-in slide-in-from-left-10 duration-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-2xl md:text-3xl text-neutral-900">Skin Profile</h3>
                    <div className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[9px] font-bold tracking-widest uppercase shrink-0">AI Verified</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/50 rounded-2xl border border-neutral-100 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Tone</p>
                      <p className="text-base font-bold text-neutral-900">{analysis.tone}</p>
                    </div>
                    <div className="p-4 bg-white/50 rounded-2xl border border-neutral-100 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Undertone</p>
                      <p className="text-base font-bold text-neutral-900">{analysis.undertone}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Analysis Summary</p>
                    <p className="text-neutral-600 text-sm leading-relaxed font-light">{analysis.description}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-neutral-100 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Key Matches</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.suggestedShades.map((s, i) => (
                        <span key={i} className="px-3 py-1.5 bg-neutral-900 text-white text-[9px] font-bold rounded-lg uppercase tracking-widest shadow-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Interaction */}
            <div className="lg:col-span-7 space-y-12 order-1 lg:order-2">
              {isLoading && step === 'analyze' ? (
                <div className="py-24 md:py-32 flex flex-col items-center justify-center gap-10 bg-white/30 backdrop-blur-md rounded-[50px] border border-white/50 animate-pulse">
                  <div className="relative">
                    <div className="w-20 h-20 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-serif font-bold italic">LUMI</div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-serif text-2xl italic text-neutral-900 px-4">Decoding your natural radiance</p>
                    <p className="text-neutral-400 text-[10px] uppercase tracking-widest font-bold">Lumière AI is reading pixel depth...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-12 animate-in fade-in duration-1000">
                  <section className="space-y-8">
                    <div className="space-y-4">
                      <h2 className="text-4xl md:text-5xl font-serif text-neutral-900 tracking-tight leading-tight">Which brand should <br/> we explore?</h2>
                      <p className="text-neutral-500 font-light text-lg">Enter any luxury makeup house to view their shades.</p>
                    </div>
                    
                    <div className="relative flex flex-col sm:flex-row gap-4 p-2 md:p-3 bg-white rounded-[32px] md:rounded-[40px] border border-neutral-100 shadow-xl focus-within:shadow-2xl transition-all">
                      <input 
                        type="text" 
                        value={brandInput}
                        onChange={(e) => setBrandInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && findBrandShades()}
                        placeholder="e.g. Dior, Rare Beauty, Lancôme..."
                        className="flex-1 px-8 py-5 md:py-6 rounded-3xl bg-transparent focus:outline-none text-xl font-medium text-neutral-900 placeholder:text-neutral-300"
                        autoFocus
                      />
                      <button 
                        onClick={findBrandShades}
                        disabled={!brandInput || isLoading}
                        className="px-8 md:px-10 py-5 bg-neutral-900 text-white rounded-[24px] md:rounded-[30px] font-bold text-sm uppercase tracking-widest hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg active:scale-95 whitespace-nowrap"
                      >
                        {isLoading ? (
                           <div className="flex items-center gap-3">
                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                             Searching
                           </div>
                        ) : 'Discover Shades'}
                      </button>
                    </div>
                  </section>

                  {shades.length > 0 && (
                    <section className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 pb-6 gap-4">
                        <div className="space-y-1">
                          <h3 className="text-3xl font-serif text-neutral-900">{brandInput}</h3>
                          <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Curated catalogue for you</p>
                        </div>
                        <div className="shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-neutral-900 text-white px-5 py-2.5 rounded-full shadow-md inline-block">
                            {shades.length} Real-Time Matches
                            </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {shades.map((shade) => (
                          <div 
                            key={shade.id}
                            onClick={() => setSelectedShade(shade)}
                            className={`group relative p-6 rounded-[32px] border transition-all duration-500 cursor-pointer flex items-center gap-6 overflow-hidden ${
                              selectedShade?.id === shade.id 
                                ? 'border-neutral-900 bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] scale-[1.03]' 
                                : 'border-white/50 bg-white/40 hover:bg-white hover:shadow-xl hover:-translate-y-1'
                            }`}
                          >
                            <div className="relative shrink-0">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: shade.hex }} />
                                <div className="absolute inset-0 rounded-2xl border border-black/5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-neutral-900 text-lg truncate group-hover:text-neutral-800">{shade.name}</h4>
                              <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold mt-1">Foundation</p>
                              
                              <div className="mt-4 flex items-center gap-3">
                                <span className="text-xs font-bold text-neutral-900">Apply Trial</span>
                                <div className={`w-2 h-2 rounded-full ${selectedShade?.id === shade.id ? 'bg-green-500 animate-pulse' : 'bg-neutral-200'}`} />
                              </div>
                            </div>

                            {selectedShade?.id === shade.id && (
                                <a 
                                    href={shade.buyUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-4 bg-neutral-900 text-white rounded-2xl hover:bg-black hover:scale-110 transition-all shadow-xl animate-in fade-in slide-in-from-right-4"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </a>
                            )}
                          </div>
                        ))}
                      </div>

                      {sources.length > 0 && (
                        <div className="p-8 md:p-10 bg-white/40 backdrop-blur-md rounded-[40px] border border-white/60 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <svg className="w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                </svg>
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Search Grounding Data</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {sources.slice(0, 4).map((src, i) => (
                                    <a 
                                        key={i} 
                                        href={src.uri} 
                                        target="_blank" 
                                        className="p-4 rounded-2xl bg-white/40 hover:bg-white transition-all border border-transparent hover:border-neutral-100 flex items-start gap-4"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-neutral-900 truncate">{src.title}</p>
                                            <p className="text-[9px] text-neutral-400 truncate mt-0.5">{src.uri}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <ChatInterface />

      <footer className="max-w-7xl mx-auto px-6 py-16 md:py-24 mt-12 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-12 text-neutral-400">
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-900 flex items-center justify-center text-white font-serif text-sm">L</div>
                <span className="font-serif font-bold text-lg tracking-tight text-neutral-900 uppercase">Lumière AI</span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed font-light">The intersection of advanced neural intelligence and luxury cosmetic artistry.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-neutral-900 uppercase tracking-widest">Platform</h5>
                <ul className="text-xs space-y-2">
                    <li><a href="#" className="hover:text-neutral-900 transition-colors">Foundation Match</a></li>
                    <li><a href="#" className="hover:text-neutral-900 transition-colors">Digital Concierge</a></li>
                    <li><a href="#" className="hover:text-neutral-900 transition-colors">Brand API</a></li>
                </ul>
            </div>
            <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-neutral-900 uppercase tracking-widest">Ethics</h5>
                <ul className="text-xs space-y-2">
                    <li><a href="#" className="hover:text-neutral-900 transition-colors">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-neutral-900 transition-colors">Face Data Policy</a></li>
                    <li><a href="#" className="hover:text-neutral-900 transition-colors">AI Bias Control</a></li>
                </ul>
            </div>
            <div className="space-y-4 hidden md:block">
                <h5 className="text-[10px] font-bold text-neutral-900 uppercase tracking-widest">Contact</h5>
                <ul className="text-xs space-y-2">
                    <li><a href="#" className="hover:text-neutral-900 transition-colors">Support</a></li>
                    <li><a href="#" className="hover:text-neutral-900 transition-colors">Partnerships</a></li>
                </ul>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
