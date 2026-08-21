import { Router, type IRouter } from "express";

type FoodItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isVeg: boolean;
  rating: number;
  ratingCount: number;
  isAvailable: boolean;
  isPopular: boolean;
  preparationTime: number;
};

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type Order = {
  id: string;
  items: OrderItem[];
  total: number;
  status: "placed" | "accepted" | "preparing" | "ready" | "completed";
  pickupTime: string;
  pickupToken: string;
  placedAt: string;
};

const food: FoodItem[] = [
  {
    id: "chicken-fried-rice",
    name: "Chicken Fried Rice",
    description: "Wok-tossed rice, tender chicken, spring onion",
    price: 90,
    category: "Lunch",
    image:
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=85",
    isVeg: false,
    rating: 4.8,
    ratingCount: 128,
    isAvailable: true,
    isPopular: true,
    preparationTime: 15,
  },
  {
    id: "paneer-kathi-roll",
    name: "Paneer Kathi Roll",
    description: "Smoky paneer, peppers, onion, mint chutney",
    price: 70,
    category: "Snacks",
    image:
      "https://images.unsplash.com/photo-1628294895950-9805252327bc?auto=format&fit=crop&w=900&q=85",
    isVeg: true,
    rating: 4.7,
    ratingCount: 94,
    isAvailable: true,
    isPopular: true,
    preparationTime: 10,
  },
  {
    id: "masala-dosa",
    name: "Masala Dosa",
    description: "Crisp dosa, spiced potato, sambar, coconut chutney",
    price: 55,
    category: "Breakfast",
    image:
      "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=85",
    isVeg: true,
    rating: 4.6,
    ratingCount: 156,
    isAvailable: true,
    isPopular: false,
    preparationTime: 12,
  },
  {
    id: "chicken-biryani",
    name: "Chicken Biryani",
    description: "Fragrant basmati, spiced chicken, raita",
    price: 120,
    category: "Specials",
    image:
      "https://images.unsplash.com/photo-1563379091339-03246963d51a?auto=format&fit=crop&w=900&q=85",
    isVeg: false,
    rating: 4.9,
    ratingCount: 207,
    isAvailable: true,
    isPopular: true,
    preparationTime: 18,
  },
  {
    id: "cold-coffee",
    name: "Cold Coffee",
    description: "Creamy chilled coffee with a cocoa finish",
    price: 45,
    category: "Beverages",
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=85",
    isVeg: true,
    rating: 4.5,
    ratingCount: 83,
    isAvailable: true,
    isPopular: false,
    preparationTime: 5,
  },
  {
    id: "veg-noodles",
    name: "Veg Hakka Noodles",
    description: "Street-style noodles, fresh vegetables, sesame",
    price: 75,
    category: "Lunch",
    image:
      "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=85",
    isVeg: true,
    rating: 4.4,
    ratingCount: 61,
    isAvailable: false,
    isPopular: false,
    preparationTime: 15,
  },
];

const slots = [
  { id: "12-00", startTime: "12:00 PM", endTime: "12:15 PM", capacity: 20, booked: 18, isAvailable: true },
  { id: "12-15", startTime: "12:15 PM", endTime: "12:30 PM", capacity: 20, booked: 13, isAvailable: true },
  { id: "12-30", startTime: "12:30 PM", endTime: "12:45 PM", capacity: 20, booked: 6, isAvailable: true },
  { id: "12-45", startTime: "12:45 PM", endTime: "1:00 PM", capacity: 20, booked: 20, isAvailable: false },
  { id: "1-00", startTime: "1:00 PM", endTime: "1:15 PM", capacity: 20, booked: 4, isAvailable: true },
];

let orders: Order[] = [
  {
    id: "#CF1024",
    items: [{ id: "chicken-fried-rice", name: "Chicken Fried Rice", price: 90, quantity: 2, image: food[0].image }],
    total: 180,
    status: "preparing",
    pickupTime: "1:00 PM – 1:15 PM",
    pickupToken: "A15",
    placedAt: "Today, 12:42 PM",
  },
];

const notifications = [
  { id: "n1", type: "order_ready", title: "Food ready soon", message: "Your Chicken Fried Rice is being prepared for pickup.", time: "10 min ago", read: false },
  { id: "n2", type: "special", title: "Today's special", message: "Chicken Biryani is available while supplies last.", time: "1 hr ago", read: false },
  { id: "n3", type: "order_accepted", title: "Order accepted", message: "The canteen has accepted your order.", time: "2 hr ago", read: true },
];

const router: IRouter = Router();

router.get("/menu", (_req, res) => res.json(food));
router.get("/pickup-slots", (_req, res) => res.json(slots));
router.get("/orders", (_req, res) => res.json(orders));
router.get("/orders/:orderId", (req, res) => {
  const order = orders.find((item) => item.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  return res.json(order);
});
router.post("/orders", (req, res) => {
  const input = req.body as { items?: OrderItem[]; pickupSlotId?: string; paymentMethod?: string };
  const slot = slots.find((item) => item.id === input.pickupSlotId) ?? slots[1];
  const items = input.items ?? [];
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order: Order = {
    id: `#CF${Math.floor(1000 + Math.random() * 8999)}`,
    items,
    total,
    status: "placed",
    pickupTime: `${slot.startTime} – ${slot.endTime}`,
    pickupToken: `A${Math.floor(10 + Math.random() * 89)}`,
    placedAt: "Just now",
  };
  orders = [order, ...orders];
  return res.status(201).json(order);
});
router.get("/notifications", (_req, res) => res.json(notifications));
router.post("/notifications/read-all", (_req, res) => {
  notifications.forEach((notification) => {
    notification.read = true;
  });
  return res.json(notifications);
});

export default router;