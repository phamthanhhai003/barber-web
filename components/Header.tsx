
import React from 'react';
import { ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const Header: React.FC<HeaderProps> = ({ viewMode, setViewMode }) => {
  return (
    <header className="border-b-4 border-black py-8 px-4 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 bg-white sticky top-0 z-50">
      <div className="flex flex-col items-center md:items-start group cursor-default">
        <h1 className="text-5xl font-black tracking-tighter uppercase leading-none group-hover:italic transition-all">Gâu Barber</h1>
        <div className="flex items-center gap-3 mt-2">
          <p className="text-[11px] tracking-[0.5em] uppercase opacity-40 font-black">Professional Studio</p>
          <span className="h-1.5 w-1.5 bg-black rounded-full animate-pulse"></span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <nav className="flex border-4 border-black p-1.5 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <button
            onClick={() => setViewMode(ViewMode.CUSTOMER)}
            className={`px-8 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${
              viewMode === ViewMode.CUSTOMER ? 'bg-black text-white' : 'hover:bg-gray-100 text-black opacity-30'
            }`}
          >
            Khách Hàng
          </button>
          <button
            onClick={() => setViewMode(ViewMode.OWNER)}
            className={`px-8 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${
              viewMode === ViewMode.OWNER ? 'bg-black text-white' : 'hover:bg-gray-100 text-black opacity-30'
            }`}
          >
            Chủ Tiệm
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
