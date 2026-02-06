
import React, { useState } from 'react';
import { SERVICES, TIME_SLOTS } from '../constants';
import { Booking, Service } from '../types';
import ServiceCard from './ServiceCard';
import BookingForm from './BookingForm';
import StyleConsultant from './StyleConsultant';

interface CustomerPortalProps {
  onBookingSuccess: (booking: Booking) => void;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ onBookingSuccess }) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleBooking = (data: { name: string, phone: string, date: string, time: string }) => {
    if (!selectedService) return;

    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      customerName: data.name,
      phoneNumber: data.phone,
      serviceId: selectedService.id,
      date: data.date,
      time: data.time,
      createdAt: Date.now(),
      status: 'pending'
    };

    onBookingSuccess(newBooking);
    setShowConfirmation(true);
    setTimeout(() => {
        setShowConfirmation(false);
        setSelectedService(null);
    }, 3000);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <section>
        <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold uppercase tracking-widest border-l-4 border-black pl-3">Dịch Vụ Của Chúng Tôi</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICES.map(service => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              onSelect={() => setSelectedService(service)}
              isSelected={selectedService?.id === service.id}
            />
          ))}
        </div>
      </section>

      {selectedService && !showConfirmation && (
        <section id="booking-section" className="animate-in slide-in-from-bottom duration-500">
            <div className="bg-black text-white p-8">
                <h2 className="text-xl font-bold uppercase tracking-widest mb-6">Thông Tin Đặt Lịch</h2>
                <p className="mb-6 text-gray-400 text-sm">Đang chọn: <span className="text-white font-bold">{selectedService.name}</span></p>
                <BookingForm 
                    onSubmit={handleBooking} 
                    onCancel={() => setSelectedService(null)} 
                />
            </div>
        </section>
      )}

      {showConfirmation && (
          <div className="fixed inset-0 bg-white/95 z-50 flex items-center justify-center p-4">
              <div className="text-center space-y-4 max-w-md">
                <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-3xl font-black uppercase">Đã Gửi Đơn Đặt!</h2>
                <p className="text-sm tracking-wide">Cảm ơn bạn đã tin tưởng Gâu Barber. Chúng tôi sẽ sớm liên hệ xác nhận.</p>
              </div>
          </div>
      )}

      <section>
        <StyleConsultant />
      </section>
    </div>
  );
};

export default CustomerPortal;
