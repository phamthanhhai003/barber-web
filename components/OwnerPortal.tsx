
import React, { useMemo } from 'react';
import { Booking } from '../types';
import { SERVICES } from '../constants';

interface OwnerPortalProps {
  bookings: Booking[];
  onUpdateStatus: (id: string, status: Booking['status']) => void;
}

const OwnerPortal: React.FC<OwnerPortalProps> = ({ bookings, onUpdateStatus }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const stats = useMemo(() => {
    const todayBookings = bookings.filter(b => b.date === today);
    const totalIncome = todayBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => {
        const s = SERVICES.find(srv => srv.id === b.serviceId);
        return sum + (s?.price || 0);
      }, 0);

    return {
      todayCount: todayBookings.length,
      pendingCount: todayBookings.filter(b => b.status === 'pending').length,
      completedCount: todayBookings.filter(b => b.status === 'completed').length,
      totalIncome
    };
  }, [bookings, today]);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.time.localeCompare(b.time);
    });
  }, [bookings]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hôm nay', value: stats.todayCount },
          { label: 'Chờ duyệt', value: stats.pendingCount },
          { label: 'Hoàn thành', value: stats.completedCount },
          { label: 'Doanh thu dự kiến', value: `${(stats.totalIncome / 1000).toFixed(0)}k`, full: stats.totalIncome.toLocaleString('vi-VN') + 'đ' }
        ].map((stat, i) => (
          <div key={i} className="border border-black p-4 text-center">
            <p className="text-[10px] uppercase tracking-widest mb-1 opacity-60">{stat.label}</p>
            <p className="text-2xl font-black">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="border border-black overflow-hidden">
        <div className="bg-black text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xs font-black uppercase tracking-widest">Danh sách đặt lịch</h2>
          <span className="text-[10px] opacity-60">Toàn bộ thời gian</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-black">
              <tr>
                <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold">Ngày/Giờ</th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold">Khách Hàng</th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold">Dịch Vụ</th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedBookings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm italic opacity-50">Chưa có đơn hàng nào được đặt.</td>
                </tr>
              ) : (
                sortedBookings.map((booking) => {
                  const service = SERVICES.find(s => s.id === booking.serviceId);
                  const isToday = booking.date === today;
                  
                  return (
                    <tr key={booking.id} className={`${isToday ? 'bg-gray-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold">{booking.time}</p>
                        <p className="text-[10px] opacity-60">{booking.date}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold uppercase">{booking.customerName}</p>
                        <p className="text-[10px] opacity-60">{booking.phoneNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs">{service?.name}</p>
                        <p className="text-[10px] font-mono">{service?.price.toLocaleString()}đ</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {booking.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => onUpdateStatus(booking.id, 'completed')}
                                className="text-[9px] uppercase font-bold tracking-tighter border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors"
                              >
                                Xong
                              </button>
                              <button 
                                onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                                className="text-[9px] uppercase font-bold tracking-tighter border border-red-500 text-red-500 px-2 py-1 hover:bg-red-500 hover:text-white transition-colors"
                              >
                                Hủy
                              </button>
                            </>
                          )}
                          {booking.status === 'completed' && (
                            <span className="text-[9px] uppercase font-bold text-green-600">Hoàn thành</span>
                          )}
                          {booking.status === 'cancelled' && (
                            <span className="text-[9px] uppercase font-bold text-red-400 line-through">Đã hủy</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OwnerPortal;
