import iconImg from '../assets/icon.png';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full bg-slate-900/90 backdrop-blur rounded-2xl p-8 border border-slate-800 shadow-2xl text-center space-y-6">
        <div className="flex justify-center mb-1">
          <div className="w-20 h-20 rounded-2xl bg-black/60 border border-slate-700/80 p-2 shadow-inner flex items-center justify-center">
            <img src={iconImg} alt="CareerFlow Logo" className="w-full h-full object-contain rounded-xl" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
            CareerFlow
          </h1>
          <p className="text-slate-400 text-sm mt-1 leading-relaxed">
            AI-Powered Career Development & Placement Preparation Platform for Students.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left pt-2">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <span className="font-semibold text-slate-200 block mb-1">🎯 Resume Analyzer</span>
            <span className="text-slate-400">ATS scoring & keyword gap analysis</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <span className="font-semibold text-slate-200 block mb-1">🤖 AI Mock Interview</span>
            <span className="text-slate-400">HR, Technical & Behavioral rounds</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <span className="font-semibold text-slate-200 block mb-1">📊 Student Dashboard</span>
            <span className="text-slate-400">Career readiness & analytics</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <span className="font-semibold text-slate-200 block mb-1">🏆 Gamification</span>
            <span className="text-slate-400">XP points, badges & streaks</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-400 font-mono">
          ✓ CareerFlow Icon & Assets Integrated
        </div>
      </div>
    </div>
  );
}
