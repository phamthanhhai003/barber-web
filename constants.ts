
import { Service } from './types';

export const SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Cắt Tóc Cơ Bản',
    price: 100000,
    duration: '30 phút',
    description: 'Cắt và tỉa form tóc chuẩn phong cách.'
  },
  {
    id: 's2',
    name: 'Gói Cắt & Gội Massage',
    price: 180000,
    duration: '60 phút',
    description: 'Bao gồm cắt tóc, gội đầu và massage mặt thư giãn.'
  },
  {
    id: 's3',
    name: 'Combo Đặc Biệt (V.I.P)',
    price: 350000,
    duration: '90 phút',
    description: 'Full combo: Cắt, Gội, Uốn/Nhuộm nhẹ và Waxing.'
  },
  {
    id: 's4',
    name: 'Tỉa Râu & Chăm Sóc Da Mặt',
    price: 120000,
    duration: '40 phút',
    description: 'Dành riêng cho quý ông yêu thích sự chỉn chu.'
  }
];

export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];
