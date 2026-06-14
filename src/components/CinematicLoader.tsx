export default function CinematicLoader() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center overflow-hidden">
      {/* Background Noise / Grain */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 via-[#050505] to-[#050505]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Large Typography Loader */}
      <div className="relative w-full flex justify-center items-center h-full">
        <h1 
          className="text-7xl md:text-[8rem] lg:text-[12rem] font-black uppercase tracking-tighter text-transparent stroke-text animate-fill-gradient select-none"
          style={{ 
            backgroundImage: 'linear-gradient(to right, #EA580C 50%, transparent 50%)', 
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text'
          }}
        >
          SERU.NI
        </h1>
      </div>
      
      <div className="absolute bottom-10 lg:bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
        <div className="flex gap-2 items-center">
           <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-ping" />
           <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-ping" style={{animationDelay: "0.2s"}} />
           <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-ping" style={{animationDelay: "0.4s"}} />
        </div>
        <span className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-neutral-500 font-bold">Memuat Sistem</span>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .stroke-text {
          -webkit-text-stroke: 1px rgba(255, 255, 255, 0.1);
        }
        @keyframes fill-gradient {
          0% { background-position: 100% 0; }
          40%, 100% { background-position: 0% 0; }
        }
        .animate-fill-gradient {
          animation: fill-gradient 2s cubic-bezier(0.85, 0, 0.15, 1) infinite;
        }
      `}} />
    </div>
  );
}
