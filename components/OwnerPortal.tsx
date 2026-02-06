
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
        // Ưu tiên đơn mới nhất (theo thời gian tạo)
        return b.createdAt - a.createdAt;
    });
  }, [bookings]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black uppercase tracking-tighter">Bảng điều khiển chủ tiệm</h2>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">Hệ thống đang trực tuyến</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Đơn hôm nay', value: stats.todayCount },
          { label: 'Đang chờ', value: stats.pendingCount },
          { label: 'Đã xong', value: stats.completedCount },
          { label: 'Thu nhập (đ)', value: stats.totalIncome.toLocaleString('vi-VN') }
        ].map((stat, i) => (
          <div key={i} className="border border-black p-4 bg-white hover:bg-black hover:text-white transition-colors group">
            <p className="text-[9px] uppercase tracking-widest mb-1 opacity-60 group-hover:opacity-100">{stat.label}</p>
            <p className="text-2xl font-black tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="border border-black overflow-hidden bg-white shadow-sm">
        <div className="bg-black text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-black uppercase tracking-widest">Đơn hàng mới nhất</h2>
            {stats.pendingCount > 0 && (
              <span className="bg-white text-black text-[9px] px-2 py-0.5 font-bold rounded-full animate-bounce">
                {stats.pendingCount} MỚI
              </span>
            )}
          </div>
          <span className="text-[9px] opacity-60 uppercase tracking-widest">Sắp xếp theo thời gian đặt</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-black">
              <tr>
                <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold">Khách Hàng</th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold">Lịch Hẹn</th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold">Dịch Vụ</th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedBookings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm italic opacity-50">Chưa có đơn hàng nào.</td>
                </tr>
              ) : (
                sortedBookings.map((booking) => {
                  const service = SERVICES.find(s => s.id === booking.serviceId);
                  const isToday = booking.date === today;
                  const isNew = Date.now() - booking.createdAt < 60000; // Đơn trong vòng 1 phút
                  
                  return (
                    <tr key={booking.id} className={`${isNew ? 'bg-yellow-50/50' : ''} ${isToday && booking.status === 'pending' ? 'bg-gray-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold uppercase tracking-tight">{booking.customerName}</span>
                          <span className="text-[10px] opacity-60">{booking.phoneNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{booking.time}</span>
                          <span className={`text-[9px] uppercase font-bold ${isToday ? 'text-black' : 'opacity-40'}`}>
                            {isToday ? 'Hôm nay' : booking.date}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">{service?.name}</span>
                          <span className="text-[10px] opacity-60">{service?.price.toLocaleString()}đ</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {booking.status === 'pending' ? (
                            <>
                              <button 
                                onClick={() => onUpdateStatus(booking.id, 'completed')}
                                className="text-[9px] uppercase font-black tracking-widest border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none"
                              >
                                Hoàn tất
                              </button>
                              <button 
                                onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                                className="text-[9px] uppercase font-bold tracking-widest border border-gray-200 px-3 py-1.5 hover:border-red-500 hover:text-red-500 transition-all"
                              >
                                Hủy
                              </button>
                            </>
                          ) : (
                            <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-1 ${
                              booking.status === 'completed' ? 'text-green-600 bg-green-50' : 'text-red-400 line-through bg-red-50'
                            }`}>
                              {booking.status === 'completed' ? 'Đã xong' : 'Đã hủy'}
                            </span>
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
