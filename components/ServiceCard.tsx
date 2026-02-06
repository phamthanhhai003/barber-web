
import React from 'react';
import { Service } from '../types';

interface ServiceCardProps {
  service: Service;
  onSelect: () => void;
  isSelected: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSelect, isSelected }) => {
  return (
    <div 
      className={`border-2 p-6 transition-all cursor-pointer flex flex-col justify-between h-full ${
        isSelected 
        ? 'border-black bg-black text-white' 
        : 'border-gray-200 hover:border-black bg-white text-black'
      }`}
      onClick={onSelect}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold uppercase">{service.name}</h3>
            <span className={`text-xs font-mono px-2 py-1 rounded ${isSelected ? 'bg-white text-black' : 'bg-black text-white'}`}>
                {service.duration}
            </span>
        </div>
        <p className={`text-sm mb-6 ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>
          {service.description}
        </p>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xl font-black">
          {service.price.toLocaleString('vi-VN')}đ
        </span>
        <span className="text-[10px] uppercase font-bold tracking-widest border-b border-current">
          {isSelected ? 'Đang chọn' : 'Đặt lịch'}
        </span>
      </div>
    </div>
  );
};

export default ServiceCard;
