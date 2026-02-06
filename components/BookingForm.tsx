
import React, { useState } from 'react';
import { TIME_SLOTS } from '../constants';

interface BookingFormProps {
  onSubmit: (data: { name: string, phone: string, date: string, time: string }) => void;
  onCancel: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    time: TIME_SLOTS[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-2 opacity-70">Tên của bạn</label>
          <input
            type="text"
            required
            className="w-full bg-transparent border-b border-gray-600 focus:border-white outline-none py-2 px-1 text-white placeholder-gray-700"
            placeholder="NGUYỄN VĂN A"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-2 opacity-70">Số điện thoại</label>
          <input
            type="tel"
            required
            className="w-full bg-transparent border-b border-gray-600 focus:border-white outline-none py-2 px-1 text-white placeholder-gray-700"
            placeholder="09xx xxx xxx"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-2 opacity-70">Chọn Ngày</label>
          <input
            type="date"
            required
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-transparent border-b border-gray-600 focus:border-white outline-none py-2 px-1 text-white appearance-none"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-2 opacity-70">Chọn Giờ</label>
          <select
            className="w-full bg-black border-b border-gray-600 focus:border-white outline-none py-2 px-1 text-white cursor-pointer"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          >
            {TIME_SLOTS.map(slot => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="md:col-span-2 flex gap-4 mt-4">
        <button
          type="submit"
          className="flex-1 bg-white text-black py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors"
        >
          Xác Nhận Đặt Lịch
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-4 text-xs font-bold uppercase tracking-wider border border-gray-600 hover:border-white transition-colors"
        >
          Hủy
        </button>
      </div>
    </form>
  );
};

export default BookingForm;
