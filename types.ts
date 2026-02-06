
export interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
}

export interface Booking {
  id: string;
  customerName: string;
  phoneNumber: string;
  serviceId: string;
  date: string;
  time: string;
  createdAt: number;
  status: 'pending' | 'completed' | 'cancelled';
}

export enum ViewMode {
  CUSTOMER = 'customer',
  OWNER = 'owner'
}
