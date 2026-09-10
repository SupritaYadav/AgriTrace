export const ORIGINS = {
  abc: { farmName: "ABC Organic Farm", city: "Varanasi", district: "Varanasi", state: "Uttar Pradesh" },
  sun: { farmName: "Sunrise Growers Collective", city: "Nashik", district: "Nashik", state: "Maharashtra" },
  gan: { farmName: "Ganga Valley Farms", city: "Prayagraj", district: "Prayagraj", state: "Uttar Pradesh" },
};

export let devices = [
  { id: "AGR-NODE-001", status: "Online", assignedShipment: "AGR-SHP-001", battery: 82, lastSeen: "2 min ago", temp: 24.6, firmware: "v2.3.1" },
  { id: "AGR-NODE-002", status: "Available", assignedShipment: null, battery: 95, lastSeen: "1 min ago", temp: 22.1, firmware: "v2.3.1" },
  { id: "AGR-NODE-003", status: "Assigned", assignedShipment: "AGR-SHP-002", battery: 71, lastSeen: "3 min ago", temp: 28.1, firmware: "v2.2.9" },
  { id: "AGR-NODE-004", status: "Offline", assignedShipment: "AGR-SHP-003", battery: 34, lastSeen: "42 min ago", temp: 19.7, firmware: "v2.2.9" },
  { id: "AGR-NODE-005", status: "Available", assignedShipment: null, battery: 88, lastSeen: "4 min ago", temp: 23.0, firmware: "v2.3.1" },
  { id: "AGR-NODE-006", status: "Online", assignedShipment: "AGR-SHP-004", battery: 64, lastSeen: "1 min ago", temp: 21.4, firmware: "v2.3.0" },
];

export let shipments = [
  { id: "AGR-SHP-001", product: "Tomatoes", category: "Vegetables", batch: "AGR-BATCH-001", source: "Varanasi", destination: "Delhi Warehouse", device: "AGR-NODE-001", status: "In Transit", temp: 24.6, humidity: 68, gas: "Safe", battery: 82, updated: "2 min ago", quantity: "500 kg", vehicle: "UP32 AB 4521", driver: "Suresh Yadav", startDate: "06 Sep 2026", eta: "08 Sep 2026", progress: 55, stage: 1,
    coords: "26.4499, 80.3319", currentLoc: "Kanpur, Uttar Pradesh", distanceRemaining: "394 km", arrival: "6 hr 20 min" },
  { id: "AGR-SHP-002", product: "Mangoes", category: "Fruits", batch: "AGR-BATCH-002", source: "Lucknow", destination: "Mumbai", device: "AGR-NODE-003", status: "Delayed", temp: 28.1, humidity: 74, gas: "Safe", battery: 71, updated: "5 min ago", quantity: "800 kg", vehicle: "UP32 CD 7788", driver: "Manoj Tiwari", startDate: "05 Sep 2026", eta: "09 Sep 2026", progress: 40, stage: 1,
    coords: "23.1815, 79.9864", currentLoc: "Jabalpur, Madhya Pradesh", distanceRemaining: "820 km", arrival: "14 hr 10 min" },
  { id: "AGR-SHP-003", product: "Potatoes", category: "Vegetables", batch: "AGR-BATCH-003", source: "Prayagraj", destination: "Kanpur", device: "AGR-NODE-004", status: "Warehouse", temp: 19.7, humidity: 55, gas: "Safe", battery: 34, updated: "1 min ago", quantity: "1200 kg", vehicle: "UP70 EF 3345", driver: "Ravi Kumar", startDate: "04 Sep 2026", eta: "06 Sep 2026", progress: 80, stage: 2,
    coords: "26.4499, 80.3319", currentLoc: "Kanpur Central Warehouse", distanceRemaining: "0 km", arrival: "Arrived" },
  { id: "AGR-SHP-004", product: "Green Chillies", category: "Vegetables", batch: "AGR-BATCH-004", source: "Nashik", destination: "Pune Retail Hub", device: "AGR-NODE-006", status: "In Transit", temp: 21.4, humidity: 60, gas: "Safe", battery: 64, updated: "1 min ago", quantity: "300 kg", vehicle: "MH12 GH 9091", driver: "Amit Deshmukh", startDate: "07 Sep 2026", eta: "08 Sep 2026", progress: 65, stage: 1,
    coords: "19.9975, 73.7898", currentLoc: "Nashik Bypass", distanceRemaining: "180 km", arrival: "3 hr 40 min" },
  { id: "AGR-SHP-005", product: "Bananas", category: "Fruits", batch: "AGR-BATCH-005", source: "Prayagraj", destination: "Varanasi Retail", device: "—", status: "Alert", temp: 33.4, humidity: 82, gas: "Warning", battery: 58, updated: "8 min ago", quantity: "450 kg", vehicle: "UP70 JK 1123", driver: "Deepak Singh", startDate: "07 Sep 2026", eta: "08 Sep 2026", progress: 45, stage: 1,
    coords: "25.4358, 81.8463", currentLoc: "Prayagraj Bypass", distanceRemaining: "120 km", arrival: "2 hr 15 min" },
  { id: "AGR-SHP-006", product: "Spinach", category: "Vegetables", batch: "AGR-BATCH-006", source: "Lucknow", destination: "Kanpur Retail", device: null, status: "In Transit", temp: 20.2, humidity: 58, gas: "Safe", battery: 0, updated: "10 min ago", quantity: "220 kg", vehicle: "UP32 LM 5567", driver: "Ajay Verma", startDate: "08 Sep 2026", eta: "08 Sep 2026", progress: 25, stage: 1,
    coords: "26.8467, 80.9462", currentLoc: "Lucknow Outskirts", distanceRemaining: "88 km", arrival: "1 hr 50 min" },
  { id: "AGR-SHP-007", product: "Wheat", category: "Grains", batch: "AGR-BATCH-007", source: "Varanasi", destination: "Delhi Warehouse", device: null, status: "Delivered", temp: 22.0, humidity: 45, gas: "Safe", battery: 0, updated: "1 day ago", quantity: "2000 kg", vehicle: "UP65 NO 4432", driver: "Rakesh Pal", startDate: "01 Sep 2026", eta: "03 Sep 2026", progress: 100, stage: 4,
    coords: "28.7041, 77.1025", currentLoc: "Delhi Central Warehouse", distanceRemaining: "0 km", arrival: "Delivered" },
];

export let alerts = [
  { id: "AL-101", severity: "Critical", type: "Environmental", title: "Temperature Threshold Exceeded", shipment: "AGR-SHP-005", detail: "33.4°C", time: "8 minutes ago", resolved: false },
  { id: "AL-102", severity: "Warning", type: "Environmental", title: "Humidity High", shipment: "AGR-SHP-009", detail: "86%", time: "24 minutes ago", resolved: false },
  { id: "AL-103", severity: "Device", type: "Device", title: "Device Offline", shipment: "AGR-NODE-008", detail: "No signal", time: "42 minutes ago", resolved: false },
  { id: "AL-104", severity: "Warning", type: "Environmental", title: "Gas Level Slightly Elevated", shipment: "AGR-SHP-002", detail: "38 ppm", time: "1 hour ago", resolved: false },
  { id: "AL-105", severity: "Critical", type: "Environmental", title: "Cold Chain Breach", shipment: "AGR-SHP-006", detail: "31.9°C", time: "2 hours ago", resolved: true },
  { id: "AL-106", severity: "Device", type: "Device", title: "Low Battery Warning", shipment: "AGR-NODE-004", detail: "34%", time: "3 hours ago", resolved: false },
];

export let history = shipments.filter(s => s.status === "Delivered").concat([
  { id: "AGR-SHP-H01", product: "Onions", category: "Vegetables", source: "Nashik", destination: "Pune", device: "AGR-NODE-002", status: "Delivered", temp: 21.0, updated: "3 days ago" },
  { id: "AGR-SHP-H02", product: "Rice", category: "Grains", source: "Prayagraj", destination: "Lucknow", device: "AGR-NODE-005", status: "Delivered", temp: 19.5, updated: "5 days ago" },
]);

export let currentUser = { name: "Kritika Gupta", role: "Operations Manager", org: "AgriTrace Demo Network" };

export function statusBadgeClass(status) {
  switch(status){
    case "In Transit": return "transit";
    case "Delivered": return "delivered";
    case "Delayed": return "delayed";
    case "Warehouse": return "warehouse";
    case "Alert": return "alert";
    case "Online": return "online";
    case "Offline": return "offline";
    case "Available": return "available";
    case "Assigned": return "assigned";
    default: return "transit";
  }
}