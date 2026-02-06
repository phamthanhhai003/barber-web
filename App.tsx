
import React, { useState, useEffect, useCallback } from 'react';
import { ViewMode, Booking } from './types';
import Header from './components/Header';
import CustomerPortal from './components/CustomerPortal';
import OwnerPortal from './components/OwnerPortal';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CUSTOMER);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Load bookings from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('barber_bookings');
    if (saved) {
      try {
        setBookings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse bookings", e);
      }
    }
  }, []);

  // Save bookings whenever they change
  useEffect(() => {
    localStorage.setItem('barber_bookings', JSON.stringify(bookings));
  }, [bookings]);

  const addBooking = useCallback((newBooking: Booking) => {
    setBookings(prev => [...prev, newBooking]);
  }, []);

  const updateBookingStatus = useCallback((id: string, status: Booking['status']) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  }, []);

  return (
    <div className="min-h-screen bg-white text-black transition-colors duration-300">
      <Header viewMode={viewMode} setViewMode={setViewMode} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {viewMode === ViewMode.CUSTOMER ? (
          <CustomerPortal onBookingSuccess={addBooking} />
        ) : (
          <OwnerPortal 
            bookings={bookings} 
            onUpdateStatus={updateBookingStatus} 
          />
        )}
      </main>

      <footer className="mt-12 py-8 border-t border-black text-center text-xs uppercase tracking-widest opacity-50">
        &copy; {new Date().getFullYear()} Gâu Barber Studio. Vietnam.
      </footer>
    </div>
  );
};

export default App;
