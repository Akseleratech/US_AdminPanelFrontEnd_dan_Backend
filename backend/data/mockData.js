// Mock data for the application
const dashboardStats = {
  totalBookings: 245,
  totalRevenue: 125000000,
  activeSpaces: 89,
  totalUsers: 1230
};

const recentOrders = [
  { 
    id: 'ORD001', 
    customer: 'John Doe', 
    service: 'Private Office', 
    location: 'Jakarta Selatan', 
    amount: 2500000, 
    status: 'confirmed', 
    date: '2024-06-15' 
  },
  { 
    id: 'ORD002', 
    customer: 'Jane Smith', 
    service: 'Meeting Room', 
    location: 'Bandung', 
    amount: 150000, 
    status: 'pending', 
    date: '2024-06-15' 
  },
  { 
    id: 'ORD003', 
    customer: 'PT. ABC Corp', 
    service: 'Event Space', 
    location: 'Surabaya', 
    amount: 5000000, 
    status: 'completed', 
    date: '2024-06-14' 
  },
  { 
    id: 'ORD004', 
    customer: 'Michael Johnson', 
    service: 'Coworking Space', 
    location: 'Jakarta Pusat', 
    amount: 500000, 
    status: 'cancelled', 
    date: '2024-06-14' 
  },
];

const spaces = [
  { 
    id: 1, 
    name: 'Office Suite A1', 
    type: 'Private Office', 
    location: 'Jakarta Selatan', 
    capacity: 4, 
    price: 2500000, 
    status: 'available' 
  },
  { 
    id: 2, 
    name: 'Meeting Room Beta', 
    type: 'Meeting Room', 
    location: 'Bandung', 
    capacity: 8, 
    price: 150000, 
    status: 'occupied' 
  },
  { 
    id: 3, 
    name: 'Event Hall Premium', 
    type: 'Event Space', 
    location: 'Surabaya', 
    capacity: 100, 
    price: 5000000, 
    status: 'available' 
  },
  { 
    id: 4, 
    name: 'Hot Desk Area', 
    type: 'Coworking Space', 
    location: 'Jakarta Pusat', 
    capacity: 20, 
    price: 500000, 
    status: 'available' 
  },
];

const cities = [
  { 
    id: 1, 
    name: 'Jakarta', 
    locations: 5, 
    totalSpaces: 45, 
    status: 'active' 
  },
  { 
    id: 2, 
    name: 'Bandung', 
    locations: 3, 
    totalSpaces: 25, 
    status: 'active' 
  },
  { 
    id: 3, 
    name: 'Surabaya', 
    locations: 2, 
    totalSpaces: 19, 
    status: 'active' 
  },
  { 
    id: 4, 
    name: 'Yogyakarta', 
    locations: 1, 
    totalSpaces: 8, 
    status: 'inactive' 
  },
];

const services = [
  { 
    id: 1, 
    name: 'Private Office', 
    description: 'Ruang kantor privat dengan fasilitas lengkap', 
    price: 2500000, 
    status: 'active' 
  },
  { 
    id: 2, 
    name: 'Virtual Office', 
    description: 'Alamat bisnis dengan layanan sekretaris', 
    price: 300000, 
    status: 'active' 
  },
  { 
    id: 3, 
    name: 'Event Space', 
    description: 'Ruang acara dengan kapasitas besar', 
    price: 5000000, 
    status: 'active' 
  },
  { 
    id: 4, 
    name: 'Meeting Room', 
    description: 'Ruang meeting dengan fasilitas presentasi', 
    price: 150000, 
    status: 'active' 
  },
  { 
    id: 5, 
    name: 'Coworking Space', 
    description: 'Area kerja bersama dengan suasana kolaboratif', 
    price: 500000, 
    status: 'active' 
  },
  { 
    id: 6, 
    name: 'Legalitas Bisnis', 
    description: 'Layanan bantuan legalitas dan perizinan bisnis', 
    price: 1000000, 
    status: 'active' 
  },
];

module.exports = {
  dashboardStats,
  recentOrders,
  spaces,
  cities,
  services
}; 