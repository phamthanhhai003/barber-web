
import React from 'react';
import { ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const Header: React.FC<HeaderProps> = ({ viewMode, setViewMode }) => {
  return (
    <header className="border-b border-black py-6 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-col">
        <h1 className="text-3xl font-extrabold tracking-tighter uppercase">Gâu Barber</h1>
        <p className="text-[10px] tracking-[0.3em] uppercase opacity-60">Classic Cuts • Modern Vibes</p>
      </div>

      <nav className="flex border border-black p-1 bg-white">
        <button
          onClick={() => setViewMode(ViewMode.CUSTOMER)}
          className={`px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            viewMode === ViewMode.CUSTOMER ? 'bg-black text-white' : 'hover:bg-gray-100'
          }`}
        >
          Khách Hàng
        </button>
        <button
          onClick={() => setViewMode(ViewMode.OWNER)}
          className={`px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            viewMode === ViewMode.OWNER ? 'bg-black text-white' : 'hover:bg-gray-100'
          }`}
        >
          Chủ Tiệm
        </button>
      </nav>
    </header>
  );
};

export default Header;
