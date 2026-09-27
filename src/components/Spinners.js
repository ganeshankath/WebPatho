import React from 'react';

const Spinners = () => {
  return (
    <div className="Spinner">
      <div className="flex flex-col items-center gap-3 bg-white/85 backdrop-blur-md p-6 rounded-2xl border border-slate-150 shadow-xl">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-bold text-slate-555 tracking-wide">Loading Portal...</span>
      </div>
    </div>
  );
};

export default Spinners;