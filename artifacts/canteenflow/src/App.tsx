import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Bell, CalendarClock, Check, ChevronLeft, ChevronRight, Copy, CreditCard,
  Home as HomeIcon, LogOut, Minus, PackageCheck, PartyPopper, Plus, QrCode,
  ReceiptText, Search, Settings, ShieldCheck, ShoppingBag, Soup, Star,
  Store, Ticket, Timer, Trash2, UserRound, WalletCards, Zap, Cake, FileText, X,
  MapPin, Info, Flame, History, Users, UserPlus
} from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from "wouter";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { EventBookingIntro, EventBookingWizard, MyEventBookingsPage, AdminEventBookings, AdminCelebrationItems } from "./EventBooking";

export type Food = {
  id: string; name: string; description: string; price: number; category: string;
  image: string; isVeg: boolean; rating: number; ratingCount: number;
  isAvailable: boolean; isPopular: boolean; preparationTime: number;
  session: "morning" | "afternoon" | "evening";
  availableQuantity: number;
  totalQuantity: number;
};
type CartLine = Pick<Food, "id" | "name" | "price" | "image" | "category" | "availableQuantity"> & { quantity: number };
type OrderItem = Omit<CartLine, "category">;
type Status = "placed" | "accepted" | "completed" | "cancelled" | "rejected";
type Order = { id: string; items: OrderItem[]; total: number; status: Status; pickupTime: string; pickupToken: string; placedAt: string; customerName?: string; customerPhone?: string; recipientName?: string; recipientPhone?: string; recipientHostel?: string; deliveryAddress?: string; };
type DbPickupSlot = { id: string; slot_type: "DAILY" | "CUSTOM"; slot_name: string | null; slot_date: string | null; start_time: string; end_time: string; is_active: boolean; created_at: string; };
export type Notice = { id: string; recipient_id: string | null; recipient_role: string; order_id: string | null; title: string; message: string; notification_type: string; is_read: boolean; created_at: string };
type DbOrder = { id: string; customer_name: string; customer_phone: string; total_amount: number; order_status: "placed" | "accepted" | "completed" | "cancelled" | "rejected"; pickup_time: string; payment_status: "pending" | "paid" | "failed"; created_at: string; rejection_reason?: string | null; };
type DbOrderItem = { id: string; order_id: string; food_id: string; food_name: string; quantity: number; price: number; subtotal: number; };

export type UserProfile = {
  id: string;
  name: string;
  phone: string;
  hostelType: "girls" | "boys";
  department: string;
  block: string;
  room: string;
};

// Event System Types
export type CelebrationItem = {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
};

export type EventCartLine = {
  id: string; // food_id or celebration_item_id
  name: string;
  price: number;
  quantity: number;
  type: "FOOD" | "CELEBRATION";
  image?: string;
};

export type EventCakeDetails = {
  celebration_for: string;
  cake_flavour: string;
  cake_weight: string;
  cake_shape: string;
  cake_message: string;
};

export type EventBooking = {
  id: string;
  event_type: string;
  event_name: string;
  student_name: string;
  event_date: string;
  event_time: string;
  status: Status;
  estimated_total: number;
  created_at: string;
};

export const DEFAULT_PROFILE: UserProfile = {
  id: crypto.randomUUID(),
  name: "",
  phone: "",
  hostelType: "boys",
  department: "Engineering",
  block: "",
  room: ""
};


export const money = (n: number) => `₹${n.toFixed(2)}`;

export const format12Hour = (time24: string) => {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
};

export const formatTimeRange = (range: string) => {
  if (!range) return "";
  return range.split(" - ").map(t => format12Hour(t.trim())).join(" - ");
};
const readStore = <T,>(key: string, fallback: T): T => { try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) as T : fallback; } catch { return fallback; } };
const usePersisted = <T,>(key: string, fallback: T) => {
  const [value, setValue] = useState<T>(() => readStore(key, fallback));
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue] as const;
};

export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export function Button({ children, className = "", variant = "primary", onClick, disabled = false, type = "button", testId }: { children: ReactNode; className?: string; variant?: "primary" | "quiet" | "outline" | "dark" | "danger"; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; testId?: string }) {
  const variants = { primary: "bg-[#ea6b42] text-[#fff9ec] hover:bg-[#d85836] shadow-[0_7px_18px_rgba(215,83,48,.2)]", quiet: "bg-[#f4ead9] text-[#6e4d35] hover:bg-[#eadcc5]", outline: "border border-[#d9c9b1] bg-transparent text-[#604a36] hover:bg-[#f4ead9]", dark: "bg-[#173f37] text-[#fff9ec] hover:bg-[#21564b]", danger: "bg-[#f6dfd9] text-[#ae4735] hover:bg-[#f1cec5]" };
  return <button type={type} disabled={disabled} onClick={onClick} data-testid={testId} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}>{children}</button>;
}
function FoodVisual({ item, className = "" }: { item: Pick<Food, "name" | "category" | "image">; className?: string }) {
  return <div className={`relative overflow-hidden bg-[#efb66f] ${className}`}><img src={item.image} alt={item.name} className="size-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /><span className="absolute bottom-3 left-3 hidden font-display text-4xl text-white/85">{item.name.charAt(0)}</span></div>;
}
function StatusPill({ status }: { status: string }) {
  const labels: Record<string, string> = { placed: "Placed", accepted: "Accepted", completed: "Completed", cancelled: "Cancelled", rejected: "Rejected" };
  const colors: Record<string, string> = { placed: "bg-[#f6ead0] text-[#8b6528]", accepted: "bg-[#dceee5] text-[#26735a]", completed: "bg-[#e6e0d8] text-[#716252]", cancelled: "bg-[#f6dfd9] text-[#ae4735]", rejected: "bg-[#f6dfd9] text-[#ae4735]" };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${colors[status] ?? colors.placed}`}>{labels[status] ?? status}</span>;
}
function Shell({ children, cartCount, unreadCount, canteenStatus }: { children: ReactNode; cartCount: number; unreadCount: number; canteenStatus?: "OPEN" | "CLOSED" }) {
  const [location] = useLocation();
  const links = [{ href: "/", label: "Home", icon: HomeIcon }, { href: "/menu", label: "Menu", icon: Soup }, { href: "/events", label: "Events", icon: PartyPopper }, { href: "/orders", label: "Orders", icon: ReceiptText }, { href: "/notifications", label: "Alerts", icon: Bell }];
  return <div className="grain min-h-[100dvh] bg-[#f7f0e5]"><aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col bg-[#173f37] px-5 py-6 text-[#fff8e8] lg:flex"><Link href="/" className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-[11px] bg-[#f6cb63] text-[#173f37]"><Soup size={19} /></span><span className="text-[19px] font-bold">Canteen<span className="text-[#f6cb63]">Flow</span></span></Link><div className="mt-12 rounded-2xl border border-white/10 bg-white/[.07] p-4"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.13em] text-[#f6cb63]"><Zap size={14} fill="currentColor" /> Live canteen</div><p className="mt-2 text-sm leading-5 text-[#d2e1d7]">Pickup is moving fast today. Order before the next bell.</p></div><nav className="mt-8 space-y-1.5">{links.map(({ href, label, icon: Icon }) => <Link href={href} key={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${location === href ? "bg-[#f6cb63] text-[#173f37]" : "text-[#d2e1d7] hover:bg-white/10"}`}><Icon size={18} />{label}{label === "Alerts" && unreadCount > 0 && <span className="ml-auto grid size-5 place-items-center rounded-full bg-[#ea6b42] text-[10px]">{unreadCount}</span>}</Link>)}</nav><div className="mt-auto space-y-1.5"><Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#d2e1d7]"><UserRound size={18} /> Profile</Link></div></aside><header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#e3d7c5] bg-[#f7f0e5]/95 px-5 backdrop-blur lg:ml-[236px] lg:px-10"><div className="lg:hidden"><Link href="/" className="font-bold text-[#173f37]">Canteen<span className="text-[#e9653d]">Flow</span></Link></div><div className="hidden text-sm capitalize text-[#88735d] lg:block">{location === "/" ? "Tuesday, 18 June" : location.replace("/", "").replace("-", " ")}</div><div className="ml-auto flex items-center gap-2.5"><Link href="/notifications" className="rounded-xl p-2 lg:hidden"><Bell size={19} /></Link><Link href="/cart" className="relative flex items-center gap-2 rounded-xl bg-[#173f37] px-3.5 py-2.5 text-sm font-bold text-[#fff8e8]"><ShoppingBag size={17} /><span className="hidden sm:inline">Your tray</span>{cartCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-[#f6cb63] text-[10px] text-[#173f37]">{cartCount}</span>}</Link></div></header><main className="pb-24 lg:ml-[236px] lg:pb-10">
    {canteenStatus === "CLOSED" ? (
      <div className="bg-red-600 text-white px-5 py-2.5 text-center text-sm font-bold">
        🔴 Canteen Closed. We are not accepting new orders at this time.
      </div>
    ) : canteenStatus === "OPEN" ? (
      <div className="bg-green-600 text-white px-5 py-2.5 text-center text-sm font-bold">
        🟢 Canteen is Open. You can place your orders.
      </div>
    ) : null}
    <div className="mx-auto max-w-[1230px] px-5 py-8 lg:px-10 lg:py-11">{children}</div>
  </main><nav className="fixed bottom-0 left-0 right-0 z-30 flex h-[72px] items-center justify-around border-t border-[#e3d7c5] bg-[#fffaf0]/95 px-3 backdrop-blur lg:hidden">{links.map(({ href, label, icon: Icon }) => <Link href={href} key={href} className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold ${location === href ? "text-[#df603b]" : "text-[#8c7660]"}`}><Icon size={19} /><span>{label}</span></Link>)}</nav></div>;
}

function AdminShell({ children, activeTab, setActiveTab, counts }: { children: ReactNode, activeTab: string, setActiveTab: (t: string) => void, counts: { orders: number, events: number, registrations: number, total: number } }) {
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  
  return <div className="grain min-h-[100dvh] bg-[#f7f0e5] flex">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col bg-[#173f37] px-5 py-6 text-[#fff8e8] lg:flex">
      <Link href="/admin" className="flex items-center gap-2.5 mb-8">
        <span className="grid size-9 place-items-center rounded-[11px] bg-[#f6cb63] text-[#173f37]"><Store size={19} /></span>
        <span className="text-[19px] font-bold">Admin<span className="text-[#f6cb63]">Desk</span></span>
      </Link>
      <nav className="space-y-2 flex-1">
        <button onClick={() => setActiveTab("dashboard")} className={`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold ${activeTab === "dashboard" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}`}>Dashboard</button>
        <button onClick={() => setActiveTab("menus")} className={`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold ${activeTab === "menus" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}`}>Manage Foods</button>
        <button onClick={() => setActiveTab("orders")} className={`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold ${activeTab === "orders" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}`}>
          Order Management 
        </button>
        <button onClick={() => setActiveTab("slots")} className={`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold ${activeTab === "slots" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}`}>Pickup Slots</button>
        <button onClick={() => setActiveTab("event-bookings")} className={`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold ${activeTab === "event-bookings" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}`}>
          Event Bookings
        </button>
        <button onClick={() => setActiveTab("celebrations")} className={`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold ${activeTab === "celebrations" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}`}>Celebration Items</button>
        <button onClick={() => setActiveTab("requests")} className={`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold ${activeTab === "requests" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}`}>
          Registration Requests
        </button>
        <div className="pt-4 mt-4 border-t border-white/10 space-y-1.5">
          <button onClick={() => supabase.auth.signOut()} className="w-full rounded-xl px-3 py-3 text-sm font-bold text-[#d2e1d7] hover:bg-white/10 flex items-center gap-3 text-left"><LogOut size={18} /> Sign Out</button>
        </div>
      </nav>
      <div className="text-xs text-[#a9c0b1] mt-auto">Operations Mode</div>
    </aside>
    <main className="flex-1 pb-24 lg:ml-[236px] lg:pb-10">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#e3d7c5] bg-[#f7f0e5]/95 px-5 backdrop-blur lg:px-10">
        <h1 className="font-display text-xl text-[#294b41] hidden lg:block">Canteen Operations</h1>
        <div className="ml-auto relative">
          <button onClick={() => setShowBellDropdown(!showBellDropdown)} className="relative flex items-center justify-center size-10 rounded-full hover:bg-black/5 transition">
            <Bell size={20} className="text-[#294b41]" />
            {counts.total > 0 && <span className="absolute top-1.5 right-2 grid size-4 place-items-center rounded-full bg-[#ea6b42] text-[9px] font-bold text-white border-2 border-[#f7f0e5]">{counts.total}</span>}
          </button>
          
          {showBellDropdown && (
            <div className="absolute right-0 top-[110%] w-80 rounded-2xl border border-[#e3d7c5] bg-white p-3 shadow-xl z-50 animate-rise">
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="font-bold text-[#294b41]">Pending Actions</h3>
                {counts.total > 0 && <span className="text-xs font-bold text-[#ea6b42]">{counts.total} items</span>}
              </div>
              <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {counts.total === 0 ? (
                  <p className="text-center text-sm text-[#8c745c] py-4">All caught up!</p>
                ) : (
                  <>
                    {counts.orders > 0 && (
                      <button onClick={() => { setShowBellDropdown(false); setActiveTab("orders"); }} className="w-full flex items-start gap-3 rounded-xl p-3 text-left transition hover:bg-[#f7f0e5] bg-[#fff0e9]">
                        <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#ea6b42]/10 text-[#ea6b42]"><ReceiptText size={16} /></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#294b41]">Pending Orders</p>
                          <p className="mt-0.5 text-xs text-[#7b614b]">{counts.orders} order(s) require action.</p>
                        </div>
                      </button>
                    )}
                    {counts.events > 0 && (
                      <button onClick={() => { setShowBellDropdown(false); setActiveTab("event-bookings"); }} className="w-full flex items-start gap-3 rounded-xl p-3 text-left transition hover:bg-[#f7f0e5] bg-[#fff0e9]">
                        <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#ea6b42]/10 text-[#ea6b42]"><PartyPopper size={16} /></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#294b41]">Event Bookings</p>
                          <p className="mt-0.5 text-xs text-[#7b614b]">{counts.events} event(s) awaiting confirmation.</p>
                        </div>
                      </button>
                    )}
                    {counts.registrations > 0 && (
                      <button onClick={() => { setShowBellDropdown(false); setActiveTab("requests"); }} className="w-full flex items-start gap-3 rounded-xl p-3 text-left transition hover:bg-[#f7f0e5] bg-[#fff0e9]">
                        <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#ea6b42]/10 text-[#ea6b42]"><UserPlus size={16} /></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#294b41]">Registration Requests</p>
                          <p className="mt-0.5 text-xs text-[#7b614b]">{counts.registrations} user(s) waiting for approval.</p>
                        </div>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-[1230px] px-5 py-8 lg:px-10 lg:py-11">{children}</div>
    </main>
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-[72px] items-center justify-around overflow-x-auto border-t border-[#e3d7c5] bg-[#173f37] px-3 backdrop-blur lg:hidden text-white no-scrollbar">
        {[
          { id: "dashboard", label: "Dash", icon: Store },
          { id: "orders", label: "Orders", icon: ReceiptText },
          { id: "event-bookings", label: "Events", icon: PartyPopper },
          { id: "menus", label: "Foods", icon: Soup },
          { id: "slots", label: "Slots", icon: CalendarClock },
          { id: "requests", label: "Requests", icon: Users }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`relative flex flex-col shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold ${activeTab === t.id ? "text-[#f6cb63]" : "text-[#d2e1d7]"}`}>
            <t.icon size={19} /><span>{t.label}</span>
          </button>
        ))}
        <Link href="/" className="flex flex-col shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold text-[#d2e1d7]"><HomeIcon size={19} /><span>Student</span></Link>
    </nav>
  </div>;
}
export function PageIntro({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) { return <div className="mb-7 animate-rise">{eyebrow && <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.17em] text-[#bb6a42]"><span className="h-px w-5 bg-[#bb6a42]" />{eyebrow}</div>}<h1 className="font-display text-[clamp(2.35rem,5vw,4rem)] leading-[.94] tracking-[-.045em] text-[#24493f]">{title}</h1>{sub && <p className="mt-3 max-w-xl text-[15px] leading-6 text-[#7a6651]">{sub}</p>}</div>; }
function Empty({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) { return <div className="rounded-2xl border border-dashed border-[#d8c7b1] bg-[#fbf3e7] px-6 py-12 text-center"><div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#f6cb63]/35 text-[#9b632e]"><Soup size={22} /></div><h3 className="font-display text-2xl text-[#294b41]">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-[#8a745e]">{copy}</p>{action && <div className="mt-5">{action}</div>}</div>; }
function useCart() {
  const [cart, setCart] = usePersisted<CartLine[]>("canteenflow-cart", []);
  const add = (food: Food) => setCart((current) => { 
    const found = current.find((line) => line.id === food.id); 
    if (found && found.quantity >= food.availableQuantity) { alert(`Only ${food.availableQuantity} items are currently available.`); return current; }
    if (!found && food.availableQuantity === 0) { alert("Out of stock."); return current; }
    return found ? current.map((line) => line.id === food.id ? { ...line, quantity: line.quantity + 1, availableQuantity: food.availableQuantity } : line) : [...current, { id: food.id, name: food.name, price: food.price, image: food.image, category: food.category, quantity: 1, availableQuantity: food.availableQuantity }]; 
  });
  const change = (id: string, delta: number) => setCart((current) => current.map((line) => {
    if (line.id === id) {
      const newQ = line.quantity + delta;
      if (newQ > line.availableQuantity) { alert(`Only ${line.availableQuantity} items are currently available.`); return line; }
      return { ...line, quantity: Math.max(0, newQ) };
    }
    return line;
  }).filter((line) => line.quantity > 0));
  return { cart, add, change, remove: (id: string) => setCart((c) => c.filter((line) => line.id !== id)), clear: () => setCart([]), count: cart.reduce((sum, item) => sum + item.quantity, 0), total: cart.reduce((sum, item) => sum + item.quantity * item.price, 0) };
}

export function useEventCart() {
  const [cart, setCart] = usePersisted<EventCartLine[]>("canteenflow-event-cart", []);
  const add = (item: { id: string; name: string; price: number; type: "FOOD" | "CELEBRATION"; image?: string }, qty: number = 1) => setCart((current) => { 
    const found = current.find((line) => line.id === item.id); 
    return found 
      ? current.map((line) => line.id === item.id ? { ...line, quantity: line.quantity + qty } : line) 
      : [...current, { ...item, quantity: qty }]; 
  });
  const change = (id: string, delta: number) => setCart((current) => current.map((line) => line.id === id ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line).filter((line) => line.quantity > 0));
  return { cart, add, change, remove: (id: string) => setCart((c) => c.filter((line) => line.id !== id)), clear: () => setCart([]), count: cart.reduce((sum, item) => sum + item.quantity, 0), total: cart.reduce((sum, item) => sum + item.quantity * item.price, 0) };
}
function FoodCard({ item, onAdd, onOrderNow }: { item: Food; onAdd: () => void; onOrderNow?: () => void }) {
  const isOutOfStock = item.availableQuantity === 0;
  return <article className="group overflow-hidden rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] shadow-warm-sm transition hover:-translate-y-1 hover:shadow-warm"><Link href={`/menu/${item.id}`} className="block"><div className="relative"><FoodVisual item={item} className="h-40 transition duration-500 group-hover:scale-[1.03]" />{item.isPopular && <span className="absolute left-3 top-3 rounded-full bg-[#f6cb63] px-2.5 py-1 text-[10px] font-bold uppercase">Popular</span>}{!item.isAvailable && <span className="absolute inset-0 grid place-items-center bg-[#173f37]/65 text-sm font-bold text-white">Sold out for now</span>}{item.isAvailable && isOutOfStock && <span className="absolute inset-0 grid place-items-center bg-[#bd5739]/80 text-sm font-bold text-white backdrop-blur-sm">OUT OF STOCK</span>}{item.isAvailable && !isOutOfStock && item.availableQuantity <= 5 && <span className="absolute right-3 top-3 rounded-full bg-[#ea6b42] px-2.5 py-1 text-[10px] font-bold uppercase text-white shadow-sm">Low Stock</span>}</div></Link><div className="p-4"><div className="flex items-start justify-between gap-3"><Link href={`/menu/${item.id}`}><h3 className="font-bold text-[#294b41]">{item.name}</h3><p className="mt-1 line-clamp-1 text-xs text-[#8b735d]">{item.description}</p></Link><span className="font-mono-brand whitespace-nowrap text-sm font-bold text-[#bd5739]">{money(item.price)}</span></div><div className="mt-4 flex items-center justify-between"><span className="flex items-center gap-1 text-xs text-[#92775b] font-bold">Available: {item.availableQuantity}</span><div className="flex gap-2">{onOrderNow && <Button disabled={!item.isAvailable || isOutOfStock} onClick={onOrderNow} variant="outline" className="px-3 py-2 text-xs">{isOutOfStock ? "SOLD OUT" : "Order Now"}</Button>}<Button disabled={!item.isAvailable || isOutOfStock} onClick={onAdd} className="px-3 py-2 text-xs">{isOutOfStock ? "SOLD OUT" : <><Plus size={15} /> Add</>}</Button></div></div></div></article>;
}
function Home({ cart, foods }: { cart: ReturnType<typeof useCart>; foods: Food[] }) {
  const [, navigate] = useLocation();
  const popular = foods.filter((item) => item.isPopular);
  
  if (foods.length === 0) {
    return <div className="py-12"><Empty title="No food items are currently available" copy="Please check back later when the canteen is restocked." action={<Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>} /></div>;
  }

  return <div className="space-y-12"><section className="relative overflow-hidden rounded-[28px] bg-[#173f37] px-6 py-10 text-[#fff8e8] shadow-warm lg:px-12 lg:py-14"><div className="absolute -right-20 -top-28 size-[330px] rounded-full border-[42px] border-[#f6cb63]/20" /><div className="relative max-w-[670px] animate-rise"><div className="mb-4 inline-flex rounded-full border border-[#f6cb63]/30 bg-[#f6cb63]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#f6cb63]">Straight from the hostel canteen</div><h1 className="font-display text-[clamp(3.4rem,7vw,6.8rem)] leading-[.86]">Skip the queue.<br /><em className="text-[#f6cb63]">Keep the good mood.</em></h1><p className="mt-6 max-w-[480px] text-[16px] leading-7 text-[#d5e3d9]">Your favourite canteen plates, ordered before the bell rings. Pick a window, walk in, walk out.</p><Link href="/menu" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#f6cb63] px-5 py-3 text-sm font-bold text-[#173f37]">Start an order <ChevronRight size={16} /></Link></div></section><section className="grid gap-4 sm:grid-cols-3">{[{ icon: CalendarClock, title: "Choose your window", copy: "Claim a real pickup time, not a vague ETA." }, { icon: Ticket, title: "Get a tiny token", copy: "One code gets your plate moving at the counter." }, { icon: PackageCheck, title: "Track the handoff", copy: "Know when it is cooking, ready, and yours." }].map(({ icon: Icon, title, copy }) => <div key={title} className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 shadow-warm-sm"><div className="mb-5 grid size-10 place-items-center rounded-xl bg-[#f6cb63]/35 text-[#9a622c]"><Icon size={19} /></div><h2 className="font-bold text-[#294b41]">{title}</h2><p className="mt-1.5 text-sm leading-5 text-[#88735d]">{copy}</p></div>)}</section><section><div className="mb-5 flex items-end justify-between"><div><div className="mb-2 text-[11px] font-bold uppercase tracking-[.17em] text-[#bb6a42]">On the counter today</div><h2 className="font-display text-4xl text-[#24493f]">Popular with your hostel</h2></div><Link href="/menu" className="text-sm font-bold text-[#c65d3c]">See full menu <ChevronRight size={16} /></Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{popular.map((item) => <FoodCard key={item.id} item={item} onAdd={() => cart.add(item)} onOrderNow={() => { cart.clear(); cart.add(item); navigate('/checkout'); }} />)}</div></section></div>;
}
function MenuPage({ cart, foods }: { cart: ReturnType<typeof useCart>; foods: Food[] }) {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState<"all" | "morning" | "afternoon" | "evening">("all");
  const filtered = foods.filter((item) => (sessionFilter === "all" || item.session === sessionFilter) && `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase()));

  const grouped = {
    morning: filtered.filter((f) => f.session === "morning"),
    afternoon: filtered.filter((f) => f.session === "afternoon"),
    evening: filtered.filter((f) => f.session === "evening"),
  };

  const handleOrderNow = (item: Food) => {
    cart.clear();
    cart.add(item);
    navigate('/checkout');
  };

  return <div className="mx-auto max-w-[1200px]">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <PageIntro eyebrow="Our menu" title="Freshly prepared." sub="Discover what's cooking today." />
      <label className="relative flex max-w-[300px] items-center text-[#8e7b68]"><Search className="absolute left-4" size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search for dishes..." className="h-12 w-full rounded-2xl border border-[#dcccb8] bg-[#fffaf0] pl-11 pr-4 text-sm outline-none transition focus:border-[#ea6b42]" /></label>
    </div>
    
    <div className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {(["all", "morning", "afternoon", "evening"] as const).map((c) => (
        <button key={c} onClick={() => setSessionFilter(c)} className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold capitalize transition ${sessionFilter === c ? "bg-[#173f37] text-white" : "border border-[#dcccb8] bg-[#fffaf0] text-[#294b41] hover:border-[#bd5739]"}`}>{c}</button>
      ))}
    </div>

    {filtered.length === 0 ? (
      <Empty title="No dishes found" copy="Try a different search or filter." />
    ) : (
      <div className="mt-8 space-y-12">
        {grouped.morning.length > 0 && (
          <section>
            <h2 className="mb-5 font-display text-2xl text-[#294b41]">🌅 Morning Specials</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{grouped.morning.map((f) => <FoodCard key={f.id} item={f} onAdd={() => cart.add(f)} onOrderNow={() => handleOrderNow(f)} />)}</div>
          </section>
        )}
        {grouped.afternoon.length > 0 && (
          <section>
            <h2 className="mb-5 font-display text-2xl text-[#294b41]">🍛 Afternoon Specials</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{grouped.afternoon.map((f) => <FoodCard key={f.id} item={f} onAdd={() => cart.add(f)} onOrderNow={() => handleOrderNow(f)} />)}</div>
          </section>
        )}
        {grouped.evening.length > 0 && (
          <section>
            <h2 className="mb-5 font-display text-2xl text-[#294b41]">🌙 Evening Specials</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{grouped.evening.map((f) => <FoodCard key={f.id} item={f} onAdd={() => cart.add(f)} onOrderNow={() => handleOrderNow(f)} />)}</div>
          </section>
        )}
      </div>
    )}
  </div>;
}
function FoodDetails({ cart, foods }: { cart: ReturnType<typeof useCart>; foods: Food[] }) {
  const { foodId = "" } = useParams<{ foodId: string }>(); const item = foods.find((food) => food.id === foodId);
  if (!item) return <Empty title="That plate went missing" copy="Return to the menu to pick another favourite." action={<Link href="/menu" className="font-bold text-[#c65d3c]">Back to menu</Link>} />;
  return <div className="mx-auto max-w-[980px]"><Link href="/menu" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#9e613f]">← Back to menu</Link><div className="grid gap-7 rounded-[28px] border border-[#e3d7c5] bg-[#fffaf0] p-5 shadow-warm-sm md:grid-cols-2 md:p-7"><FoodVisual item={item} className="min-h-[280px] rounded-2xl md:min-h-[420px]" /><div className="flex flex-col justify-center"><span className="text-[11px] font-bold uppercase tracking-[.17em] text-[#bb6a42]">{item.category} · {item.isVeg ? "Vegetarian" : "Non-vegetarian"}</span><h1 className="mt-3 font-display text-5xl leading-none text-[#24493f]">{item.name}</h1><p className="mt-5 text-base leading-7 text-[#7a6651]">{item.description}. Prepared fresh in about {item.preparationTime} minutes.</p><div className="mt-5 flex items-center gap-4"><span className="font-mono-brand text-2xl font-bold text-[#bd5739]">{money(item.price)}</span><span className="flex items-center gap-1 text-sm"><Star size={15} className="fill-[#eeb94b] text-[#eeb94b]" /> {item.rating} ({item.ratingCount})</span></div><Button disabled={!item.isAvailable} onClick={() => cart.add(item)} className="mt-8 w-full py-3.5">{item.isAvailable ? <><Plus size={17} /> Add to tray</> : "Sold out for now"}</Button><Link href="/cart" className="mt-3 text-center text-sm font-bold text-[#c65d3d]">View tray ({cart.count})</Link></div></div></div>;
}
function CartPage({ cart }: { cart: ReturnType<typeof useCart> }) {
  if (!cart.count) return <><PageIntro eyebrow="Your tray" title="Your tray is quiet." sub="Add a plate from today’s menu and it will appear here." /><Empty title="Nothing on the tray yet" copy="The good news: the menu is only one tap away." action={<Link href="/menu" className="font-bold text-[#c65d3d]">Browse menu <ChevronRight size={16} /></Link>} /></>;
  return <div className="mx-auto max-w-[980px]"><PageIntro eyebrow="Your tray" title="Ready when you are." sub="Check the little things before choosing your pickup window." /><div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]"><div className="space-y-3">{cart.cart.map((item) => <div key={item.id} className="flex gap-3 rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-3 shadow-warm-sm sm:p-4"><FoodVisual item={item} className="size-[76px] shrink-0 rounded-xl" /><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div><h3 className="truncate font-bold text-[#294b41]">{item.name}</h3><p className="mt-1 text-xs text-[#8c745c]">{money(item.price)} each</p></div><button onClick={() => cart.remove(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={16} /></button></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2 rounded-lg bg-[#f3e8d9] p-1"><button onClick={() => cart.change(item.id, -1)} aria-label="Decrease quantity" className="grid size-6 place-items-center"><Minus size={13} /></button><span className="w-5 text-center font-mono-brand text-xs font-bold">{item.quantity}</span><button onClick={() => cart.change(item.id, 1)} aria-label="Increase quantity" className="grid size-6 place-items-center"><Plus size={13} /></button></div><span className="font-mono-brand text-sm font-bold text-[#bd5739]">{money(item.price * item.quantity)}</span></div></div></div>)}</div><aside className="h-fit rounded-2xl border border-[#173f37] bg-[#173f37] p-5 text-white lg:sticky lg:top-[96px]"><h2 className="font-display text-2xl">Order summary</h2><div className="mt-5 flex justify-between border-b border-white/15 pb-4 text-sm"><span>Food total</span><span>{money(cart.total)}</span></div><div className="flex justify-between pt-4 font-bold"><span>You pay</span><span className="font-mono-brand text-xl text-[#f6cb63]">{money(cart.total)}</span></div><Link href="/checkout" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#f6cb63] px-4 py-3 text-sm font-bold text-[#173f37]">Choose pickup window <ChevronRight size={16} /></Link><button onClick={cart.clear} className="mt-3 w-full text-xs font-bold text-[#a9c0b1]">Clear tray</button></aside></div></div>;
}
function CheckoutPage({ cart, canteenStatus }: { cart: ReturnType<typeof useCart>, canteenStatus?: "OPEN" | "CLOSED" }) {
  const [, navigate] = useLocation(); 
  const [selected, setSelected] = useState(""); 
  const [payment, setPayment] = useState<"upi" | "cash">("upi"); 
  const [placing, setPlacing] = useState(false);
  const [slots, setSlots] = useState<DbPickupSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState("");
  const [profile, setProfile] = usePersisted("canteenflow-profile", DEFAULT_PROFILE);
  const [orderFor, setOrderFor] = useState<"myself" | "someone_else">("myself");

  const [recipientName, setRecipientName] = useState(profile.name);
  const [recipientPhone, setRecipientPhone] = useState(profile.phone);
  const [recipientHostelType, setRecipientHostelType] = useState<"boys" | "girls">(profile.hostelType);
  const [recipientRoom, setRecipientRoom] = useState(profile.room);
  
  useEffect(() => {
    if (orderFor === "myself") {
      setRecipientName(profile.name);
      setRecipientPhone(profile.phone);
      setRecipientHostelType(profile.hostelType);
      setRecipientRoom(profile.room);
    } else {
      setRecipientName("");
      setRecipientPhone("");
      setRecipientRoom("");
    }
  }, [orderFor, profile]);

  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchSlots(pickupDate);
  }, [pickupDate]);

  const fetchSlots = (dateStr: string) => {
    setSlotsLoading(true);
    supabase.from("pickup_slots")
      .select("*")
      .eq("is_active", true)
      .or(`slot_type.eq.DAILY,and(slot_type.eq.CUSTOM,slot_date.eq.${dateStr})`)
      .order("start_time")
      .then(({ data, error }) => {
        if (error) setSlotsError(error.message);
        else if (data) {
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          const now = new Date();
          const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          const validSlots = (data as DbPickupSlot[]).filter(s => {
            if (isToday && s.end_time < nowStr) return false;
            return true;
          });
          setSlots(validSlots);
        }
        setSlotsLoading(false);
      });
  };

  const submit = async () => { 
    if (!recipientName || !recipientPhone || !recipientRoom || !selected || !cart.count || placing) return; 
    if (!/^\d{10}$/.test(recipientPhone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    
    const currentProfileId = profile.id || crypto.randomUUID();
    if (!profile.id) setProfile({ ...profile, id: currentProfileId });

    setPlacing(true); 
    const slot = slots.find((s) => s.id === selected);
    if (!slot) return;

    // Ensure the profile exists in the DB to prevent foreign key constraint errors
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: currentProfileId,
      name: profile.name || recipientName,
      phone: profile.phone || recipientPhone,
      department: profile.department || ""
    });
    
    if (profileError) {
      console.error("Profile Upsert Error:", JSON.stringify(profileError));
    }
    
    const payload = {
      p_account_owner_id: currentProfileId,
      p_customer_name: profile.name || recipientName, 
      p_customer_phone: profile.phone || recipientPhone,
      p_recipient_name: recipientName,
      p_recipient_phone: recipientPhone,
      p_recipient_hostel: recipientHostelType === "boys" ? "Boys Hostel" : "Girls Hostel",
      p_delivery_address: recipientRoom,
      p_pickup_slot_id: slot.id,
      p_pickup_date: pickupDate,
      p_total_amount: cart.total,
      p_items: cart.cart.map(item => ({ food_id: item.id, food_name: item.name, quantity: item.quantity, price: item.price }))
    };
    
    console.log("Submitting RPC payload:", payload);

    const { data: orderId, error: orderError } = await supabase.rpc('place_order', payload);
    
    if (orderError || !orderId) { 
      console.error("RPC Error String:", JSON.stringify(orderError));
      
      // Let's alert the raw error so we know EXACTLY what's failing
      alert("Error Details: " + (orderError?.message || JSON.stringify(orderError)));
      
      setPlacing(false); 
      return; 
    } 
    
    const { data: orderData, error: fetchError } = await supabase.from("orders").select("order_number").eq("id", orderId).single();
    
    if (orderData) {
      const orderNumber = orderData.order_number;
      const myOrders = readStore<string[]>("canteenflow-my-orders", []);
      if (!myOrders.includes(orderNumber)) {
        localStorage.setItem("canteenflow-my-orders", JSON.stringify([orderNumber, ...myOrders]));
      }
      cart.clear(); 
      navigate(`/order-success/${orderNumber}`); 
    } else {
      console.error("Failed to fetch order number", fetchError);
      alert("Order placed, but failed to load tracking page.");
      cart.clear();
      navigate("/");
    }
  };
  if (!cart.count) return <Empty title="Your tray needs a plate" copy="Choose something delicious before picking a window." action={<Link href="/menu" className="font-bold text-[#c65d3d]">Back to menu</Link>} />;
  return <div className="mx-auto max-w-[1050px]"><PageIntro eyebrow="Almost there" title="Pick your moment." sub="We’ll have your order bagged and waiting inside this window." /><div className="grid gap-7 lg:grid-cols-[1fr_350px]"><div className="space-y-7"><section><h2 className="mb-3 font-display text-2xl text-[#294b41]">01 / Delivery details</h2>
  <div className="mb-5 flex gap-5 rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-4 shadow-warm-sm">
    <div className="text-sm font-bold text-[#294b41]">Who is this order for?</div>
    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#88735d] hover:text-[#e9653d]">
      <input type="radio" checked={orderFor === "myself"} onChange={() => setOrderFor("myself")} className="size-4 accent-[#e9653d]" /> Myself
    </label>
    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#88735d] hover:text-[#e9653d]">
      <input type="radio" checked={orderFor === "someone_else"} onChange={() => setOrderFor("someone_else")} className="size-4 accent-[#e9653d]" /> Someone Else
    </label>
  </div>
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <label className="text-xs font-bold text-[#294b41]">Recipient Name<input required value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="e.g. Aarav Shah" className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-[#fffaf0] px-4 text-sm outline-none focus:border-[#e27752]" /></label>
    <label className="text-xs font-bold text-[#294b41]">Phone Number<input required value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="e.g. 9876543210" className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-[#fffaf0] px-4 text-sm outline-none focus:border-[#e27752]" /></label>
    <label className="text-xs font-bold text-[#294b41]">Hostel Type<select value={recipientHostelType} onChange={(e) => setRecipientHostelType(e.target.value as "boys" | "girls")} className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-[#fffaf0] px-4 text-sm outline-none focus:border-[#e27752]"><option value="boys">Boys Hostel</option><option value="girls">Girls Hostel</option></select></label>
    <label className="text-xs font-bold text-[#294b41]">Room Number or Address<input required value={recipientRoom} onChange={(e) => setRecipientRoom(e.target.value)} placeholder="e.g. B-Block 214" className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-[#fffaf0] px-4 text-sm outline-none focus:border-[#e27752]" /></label>
  </div>
  </section><section><h2 className="mb-3 font-display text-2xl text-[#294b41]">02 / Pickup window</h2>
  <div className="mb-4 flex items-center gap-2">
    <label className="text-sm font-bold text-[#294b41]">Pickup Date:</label>
    <input type="date" value={pickupDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => { setPickupDate(e.target.value); setSelected(""); }} className="rounded-xl border border-[#dcccb8] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#e27752]" />
  </div>
  {slotsLoading ? <div className="animate-pulse p-4 text-[#8a745e]">Loading available pickup times...</div> : slotsError ? <div className="p-4 text-red-500">Unable to load pickup times. Please try again.</div> : slots.length === 0 ? <div className="p-4 text-[#8a745e]">No pickup slots are currently available for this date.</div> : <div className="grid gap-3 sm:grid-cols-2">{slots.map((slot) => { 
    return <button key={slot.id} onClick={() => setSelected(slot.id)} className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition ${selected === slot.id ? "border-[#ea6b42] bg-[#fff0e9] ring-2 ring-[#ea6b42]/15" : "border-[#e3d7c5] bg-[#fffaf0]"}`}><span className="font-bold text-[#ea6b42] mb-1">{slot.slot_name || "Custom Slot"}</span><span className="font-mono-brand text-lg font-bold text-[#294b41]">{format12Hour(slot.start_time)} — {format12Hour(slot.end_time)}</span><span className="mt-1 block text-xs font-bold text-[#7e9a76]">OPEN</span>{selected === slot.id && <Check className="absolute right-4 top-4 text-[#ea6b42]" size={18} />}</button>;
  })}</div>}</section><section><h2 className="mb-3 font-display text-2xl text-[#294b41]">03 / Payment</h2><div className="grid gap-3 sm:grid-cols-2">{(["upi", "cash"] as const).map((method) => <button key={method} onClick={() => setPayment(method)} className={`flex items-center gap-3 rounded-2xl border p-4 text-left ${payment === method ? "border-[#173f37] bg-[#eaf2ec]" : "border-[#e3d7c5] bg-[#fffaf0]"}`}><span className="grid size-10 place-items-center rounded-xl bg-[#f2e7d8]">{method === "upi" ? <CreditCard size={20} /> : <WalletCards size={20} />}</span><span><b className="block">{method === "upi" ? "UPI" : "Cash on pickup"}</b><small className="text-[#89735d]">{method === "upi" ? "Simulated secure payment" : "Keep it exact, keep it moving"}</small></span>{payment === method && <Check className="ml-auto" size={17} />}</button>)}</div></section></div><aside className="h-fit rounded-2xl bg-[#173f37] p-5 text-white lg:sticky lg:top-[96px]"><h2 className="font-display text-2xl">Your order</h2>{cart.cart.map((item) => <div key={item.id} className="mt-4 flex justify-between gap-3 text-sm text-[#c7d8cb]"><span>{item.quantity} × {item.name}</span><span>{money(item.price * item.quantity)}</span></div>)}<div className="mt-5 flex justify-between border-t border-white/15 pt-4 font-bold"><span>Total</span><span className="text-[#f6cb63]">{money(cart.total)}</span></div><Button variant="primary" className="mt-5 w-full py-3.5" onClick={submit} disabled={!recipientName || !recipientPhone || !recipientRoom || !selected || placing || canteenStatus === "CLOSED"}>{canteenStatus === "CLOSED" ? "Canteen is Closed" : placing ? "Simulating payment..." : "Place order"}</Button><p className="mt-3 text-center text-[11px] text-[#a9c0b1]">No real payment will be charged.</p></aside></div></div>;
}
function MockQr({ value }: { value: string }) { const pattern = useMemo(() => Array.from({ length: 49 }, (_, i) => ((i * 17 + value.charCodeAt(i % value.length)) % 7) < 3), [value]); return <div className="grid size-32 grid-cols-7 gap-1 rounded-xl bg-white p-2">{pattern.map((on, i) => <span key={i} className={on ? "bg-[#173f37]" : "bg-white"} />)}</div>; }
function SuccessPage() {
  const { orderNumber = "" } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("orders").select("*, order_items(*)").eq("order_number", orderNumber).single()
      .then(({ data }) => {
        setOrder(data);
        setLoading(false);
      });
  }, [orderNumber]);

  if (loading) return <div className="p-10 text-center animate-pulse text-[#8a745e]">Loading order details...</div>;
  if (!order) return <Empty title="Order Not Found" copy="We couldn't find this order." action={<Link href="/" className="font-bold text-[#c65d3d]">Go Home</Link>} />;

  return <div className="mx-auto max-w-[680px] py-6 text-center">
    <div className="mx-auto grid size-20 place-items-center rounded-[28px] bg-[#f6cb63] text-[#173f37]"><Check size={36} strokeWidth={3} /></div>
    <p className="mt-6 text-[11px] font-bold uppercase tracking-[.18em] text-[#bb6a42]">Order locked in</p>
    <h1 className="mt-2 font-display text-5xl text-[#24493f]">That’s the hard part<br /><em>done.</em></h1>
    <div className="mt-8 rounded-[26px] bg-[#173f37] p-6 text-left text-white">
      <div className="flex justify-between border-b border-white/15 pb-4 text-xs font-bold uppercase">
        <span>Order Reference</span><span>#{order.order_number}</span>
      </div>
      <div className="flex justify-between border-b border-white/15 py-4 text-sm">
        <span>Status: <StatusPill status={order.order_status} /></span>
        <span>Payment: <span className="capitalize">{order.payment_status}</span></span>
      </div>
      <div className="py-4 border-b border-white/15">
        <p className="text-[10px] uppercase font-bold text-[#9db9aa]">Deliver To</p>
        <p className="font-bold text-lg">{order.recipient_name || order.customer_name}</p>
        <p className="text-sm text-[#c4d8cb]">{order.recipient_phone || order.customer_phone} · {order.delivery_address ? `${order.recipient_hostel}, ${order.delivery_address}` : "Pickup"}</p>
        <div className="space-y-2 mt-4">
          {order.order_items.map((item: any) => (
             <div key={item.id} className="flex justify-between text-[#c4d8cb] text-sm">
               <span>{item.quantity} × {item.food_name}</span>
               <span>{money(item.subtotal)}</span>
             </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 pt-4 text-sm">
        <div><p className="text-[10px] uppercase text-[#9db9aa]">Pickup window</p><p className="mt-1 font-bold">{order.pickup_time}</p></div>
        <div><p className="text-[10px] uppercase text-[#9db9aa]">Total</p><p className="mt-1 font-bold text-[#f6cb63]">{money(order.total_amount)}</p></div>
      </div>
    </div>
    <div className="mt-7 flex flex-wrap justify-center gap-3"><Link href={`/orders/${order.order_number}`} className="rounded-xl bg-[#ea6b42] px-5 py-3 text-sm font-bold text-white shadow-[0_7px_18px_rgba(215,83,48,.2)]">Track this order</Link><Link href="/menu" className="rounded-xl border border-[#d9c9b1] bg-[#fffaf0] px-5 py-3 text-sm font-bold hover:bg-[#f4ead9]">Order something else</Link></div>
  </div>;
}

function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  useEffect(() => {
    const myOrders = readStore<string[]>("canteenflow-my-orders", []);
    if (myOrders.length) {
      supabase.from("orders").select("*, order_items(*)").in("order_number", myOrders).order("created_at", { ascending: false })
        .then(({ data }) => { if (data) setOrders(data); });
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/orders/${search.trim().toUpperCase()}`);
  };

  const active = orders.filter((o) => !['completed', 'cancelled'].includes(o.order_status));
  const past = orders.filter((o) => ['completed', 'cancelled'].includes(o.order_status));
  
  return <div>
    <PageIntro eyebrow="Your canteen trail" title="Orders, without the hunt." sub="Track your active orders or find a specific one." />
    <form onSubmit={handleSearch} className="mb-8 flex gap-3 max-w-sm">
       <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find by Order ID (e.g. 1A2B3C4D)" className="flex-1 rounded-xl border border-[#dcccb8] bg-[#fffaf0] px-4 py-2 text-sm outline-none focus:border-[#e27752]" />
       <Button type="submit">Search</Button>
    </form>
    {!orders.length ? <Empty title="No orders yet" copy="Your first shortcut is waiting on the menu." action={<Link href="/menu" className="font-bold text-[#c65d3d]">Browse menu</Link>} /> : <div className="space-y-9">{active.length > 0 && <OrderGroup title="In motion" orders={active} />}{past.length > 0 && <OrderGroup title="Earlier orders" orders={past} />}</div>}
  </div>;
}

function OrderGroup({ title, orders }: { title: string; orders: any[] }) { 
  return <section><div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#a36a43]"><Zap size={16} />{title}</div><div className="grid gap-3">{orders.map((order) => <Link href={`/orders/${order.order_number}`} key={order.id} className="group flex flex-col gap-4 rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-4 shadow-warm-sm transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-[#f2e4d0] text-[#a9613f]"><ReceiptText size={20} /></div><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono-brand text-xs font-bold">#{order.order_number}</span><StatusPill status={order.order_status} /></div><p className="mt-1 text-sm text-[#846d55]">{order.order_items.map((item: any) => `${item.quantity} × ${item.food_name}`).join(", ")}</p></div></div><div className="flex items-center justify-between gap-6 pl-14 sm:pl-0"><div className="text-right"><p className="font-mono-brand text-sm font-bold text-[#bd5739]">{money(order.total_amount)}</p><p className="mt-1 text-[11px] text-[#a08870]">{order.pickup_time}</p></div><ChevronRight size={18} /></div></Link>)}</div></section>; 
}

function TrackingPage() {
  const { orderNumber = "" } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    supabase.from("orders").select("*, order_items(*)").eq("order_number", orderNumber).single()
      .then(({ data }) => setOrder(data));
      
    const channel = supabase.channel(`public:orders:${orderNumber}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `order_number=eq.${orderNumber}` }, (payload) => {
         const newStatus = payload.new.order_status;
         setOrder((prev: any) => prev ? { ...prev, ...payload.new } : null);
         if (newStatus === "ready") {
            alert("Your food is ready for pickup!");
         }
      }).subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [orderNumber]);

  const statuses: { key: string; title: string; copy: string }[] = [{ key: "placed", title: "Order received", copy: "The canteen has your request." }, { key: "accepted", title: "Canteen accepted", copy: "Your plate has a place in the queue." }, { key: "completed", title: "Picked up", copy: "Enjoy every bite." }];
  
  if (!order) return <Empty title="Loading order..." copy="Fetching the latest updates." action={null} />;
  if (order.order_status === "cancelled" || order.order_status === "rejected") return <div className="mt-10"><Empty title={order.order_status === "rejected" ? "Order Rejected" : "Order Cancelled"} copy={order.rejection_reason ? `Reason: ${order.rejection_reason}` : "This order was cancelled."} action={<Link href="/menu" className="font-bold text-[#c65d3d]">Go back to menu</Link>} /></div>;
  
  const index = statuses.findIndex((s) => s.key === order.order_status);
  
  return <div className="mx-auto max-w-[900px]"><Link href="/orders" className="mb-7 inline-flex font-bold text-[#9e613f]">← All orders</Link><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><PageIntro eyebrow={`Order #${order.order_number}`} title={order.order_status === "ready" ? "Your plate is waiting." : "Good things in motion."} sub={`Pickup ${order.pickup_time}`} /><StatusPill status={order.order_status} /></div><div className="grid gap-6 lg:grid-cols-[1fr_280px]"><section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 shadow-warm-sm sm:p-7"><div className="mb-8 h-2 overflow-hidden rounded-full bg-[#ede1d0]"><div className="h-full rounded-full bg-[#ea6b42] transition-all duration-1000" style={{ width: `${((index + 1) / statuses.length) * 100}%` }} /></div><div className="space-y-7">{statuses.map((item, i) => <div key={item.key} className="flex gap-4"><div className={`relative grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-500 ${i <= index ? "bg-[#173f37] text-[#f6cb63]" : "border border-[#d9c9b1] text-[#b29a80]"}`}>{i <= index ? <Check size={16} /> : <span className="size-2 rounded-full bg-current" />}</div><div><h3 className="font-bold text-[#294b41]">{item.title}</h3><p className="mt-1 text-sm text-[#806a53]">{item.copy}</p></div></div>)}</div></section><aside className="h-fit rounded-2xl bg-[#173f37] p-5 text-white"><p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#a9c5b4]">Order Reference</p><p className="mt-2 font-mono-brand text-4xl font-bold text-[#f6cb63]">{order.order_number}</p><div className="mt-5 border-t border-white/15 pt-4"><p className="text-[11px] font-bold uppercase text-[#a9c5b4]">Deliver To</p><p className="mt-1 font-bold">{order.recipient_name || order.customer_name}</p><p className="text-sm text-[#c4d8cb]">{order.recipient_phone || order.customer_phone}</p><p className="text-sm text-[#c4d8cb]">{order.delivery_address ? `${order.recipient_hostel}, ${order.delivery_address}` : "Pickup"}</p></div><div className="mt-5 border-t border-white/15 pt-4"><p className="text-[11px] uppercase text-[#a9c5b4]">Order total</p><p className="mt-1 text-xl font-bold">{money(order.total_amount)}</p></div></aside></div></div>; 
}
function NotificationsPage({ notices, setNotices }: { notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>> }) { return <div className="mx-auto max-w-[850px]"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><PageIntro eyebrow="The useful kind" title="Notifications." sub="A quiet inbox for the moments worth knowing about." />{notices.some((n) => !n.is_read) && <Button variant="outline" onClick={async () => { const unreadIds = notices.filter(n => !n.is_read).map(n => n.id); setNotices(notices.map((n) => ({ ...n, is_read: true }))); await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds); }}><Check size={15} /> Mark all read</Button>}</div>{notices.length ? <div className="space-y-2">{notices.map((n) => <div key={n.id} onClick={async () => { if (!n.is_read) { setNotices(notices.map(x => x.id === n.id ? { ...x, is_read: true } : x)); await supabase.from("notifications").update({ is_read: true }).eq("id", n.id); } }} className={`flex gap-4 rounded-2xl border p-4 cursor-pointer transition ${n.is_read ? "border-[#e3d7c5] bg-[#fffaf0] opacity-75" : "border-[#edcfbd] bg-[#fff3ea] shadow-sm hover:shadow-md"}`}><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#dcece1] text-[#26735a]"><Bell size={18} /></div><div><h3 className="font-bold">{n.title}</h3><p className="mt-1 text-sm text-[#856e57]">{n.message}</p><p className="mt-2 text-[11px] font-bold text-[#ae9276]">{new Date(n.created_at).toLocaleString()}</p></div></div>)}</div> : <Empty title="All quiet here" copy="We’ll let you know when your order moves." />}</div>; }
function ProfilePage() { 
  const [saved, setSaved] = useState(false); 
  const [saving, setSaving] = useState(false);
  const [updates, setUpdates] = usePersisted("canteenflow-updates", true); 
  const [profile, setProfile] = usePersisted("canteenflow-profile", DEFAULT_PROFILE);
  
  const handleSave = async () => {
    if (!profile.name || !profile.phone) {
      alert("Name and Phone number are required.");
      return;
    }
    setSaving(true);
    
    const currentProfileId = profile.id || crypto.randomUUID();
    if (!profile.id) {
       setProfile({ ...profile, id: currentProfileId });
    }

    const { error } = await supabase.from('profiles').upsert({
      id: currentProfileId,
      name: profile.name,
      phone: profile.phone,
      department: profile.department
    });
    setSaving(false);
    
    if (error) {
      alert("Failed to save profile details.");
      console.error(error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };
  
  return <div className="mx-auto max-w-[900px]">
    <PageIntro eyebrow="Your corner of the canteen" title="Profile & settings." sub="Make the small things feel like yours." />
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <aside className="rounded-2xl bg-[#173f37] p-6 text-white h-fit">
        <div className="grid size-16 place-items-center rounded-[20px] bg-[#f6cb63] font-display text-3xl text-[#173f37]">
          {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
        </div>
        <h2 className="mt-5 font-display text-3xl break-words">{profile.name || "Student Name"}</h2>
        <p className="mt-1 text-sm text-[#b8d0c0]">{profile.phone || "No phone"}</p>
        <p className="mt-1 text-sm text-[#b8d0c0]">{profile.department}</p>
        <p className="mt-1 text-sm text-[#b8d0c0]">{profile.block || "No Block"} · Room {profile.room || "N/A"}</p>
      </aside>
      
      <div className="space-y-4">
        <section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5">
          <div className="flex items-center gap-2 font-bold"><ReceiptText size={17} /> Order History</div>
          <p className="mt-2 text-sm text-[#8e7b68]">Track your active canteen orders and view past receipts.</p>
          <Link href="/orders" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#eaf2ec] px-4 py-2.5 text-sm font-bold text-[#173f37] hover:bg-[#dcece1]">View order history <ChevronRight size={15} /></Link>
        </section>
        
        <section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5">
          <div className="flex items-center gap-2 font-bold"><Settings size={17} /> Preferences</div>
          <div className="mt-5 flex items-center justify-between">
            <div>
              <p className="font-bold">Order updates</p>
              <p className="mt-1 text-xs text-[#927a63]">Know when your plate is ready</p>
            </div>
            <button onClick={() => setUpdates(!updates)} className={`relative h-6 w-11 rounded-full ${updates ? "bg-[#173f37]" : "bg-[#d8c8b3]"}`}>
              <span className={`absolute top-1 size-4 rounded-full bg-white transition-all ${updates ? "left-6" : "left-1"}`} />
            </button>
          </div>
        </section>
        
        <section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5">
          <div className="flex items-center gap-2 font-bold"><MapPin size={17} /> Student Details</div>
          
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-[#294b41]">Full Name
              <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="e.g. Aarav Shah" className="mt-2 h-11 w-full rounded-xl border border-[#dcccb8] bg-[#fffaf0] px-3 text-sm focus:border-[#e27752] outline-none" />
            </label>
            <label className="text-xs font-bold text-[#294b41]">Phone Number
              <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="10-digit number" className="mt-2 h-11 w-full rounded-xl border border-[#dcccb8] bg-[#fffaf0] px-3 text-sm focus:border-[#e27752] outline-none" />
            </label>
            
            <label className="text-xs font-bold text-[#294b41]">Department
              <select value={profile.department} onChange={e => setProfile({...profile, department: e.target.value})} className="mt-2 h-11 w-full rounded-xl border border-[#dcccb8] bg-[#fffaf0] px-3 text-sm focus:border-[#e27752] outline-none">
                <option value="Engineering">Engineering</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Polytechnic">Polytechnic</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Allied Health">Allied Health</option>
                <option value="Science">Science</option>
              </select>
            </label>
            
            <label className="text-xs font-bold text-[#294b41]">Hostel Type
              <select value={profile.hostelType} onChange={e => setProfile({...profile, hostelType: e.target.value as "boys" | "girls"})} className="mt-2 h-11 w-full rounded-xl border border-[#dcccb8] bg-[#fffaf0] px-3 text-sm focus:border-[#e27752] outline-none">
                <option value="boys">Boys Hostel</option>
                <option value="girls">Girls Hostel</option>
              </select>
            </label>
            
            <label className="text-xs font-bold text-[#294b41]">Hostel Block
              <input value={profile.block} onChange={e => setProfile({...profile, block: e.target.value})} placeholder="e.g. B-Block" className="mt-2 h-11 w-full rounded-xl border border-[#dcccb8] bg-[#fffaf0] px-3 text-sm focus:border-[#e27752] outline-none" />
            </label>
            <label className="text-xs font-bold text-[#294b41]">Room Number
              <input value={profile.room} onChange={e => setProfile({...profile, room: e.target.value})} placeholder="e.g. 214" className="mt-2 h-11 w-full rounded-xl border border-[#dcccb8] bg-[#fffaf0] px-3 text-sm focus:border-[#e27752] outline-none" />
            </label>
          </div>
          
          <div className="mt-6 flex gap-4">
            <Button variant={saved ? "quiet" : "primary"} className="flex-1" onClick={handleSave} disabled={saving}>
              {saved ? <><Check size={15} /> Saved</> : saving ? "Saving..." : "Save details"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => supabase.auth.signOut()}>
              <LogOut size={15} /> Sign Out
            </Button>
          </div>
        </section>
      </div>
    </div>
  </div>; 
}

function ManageFoods() {
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [session, setSession] = useState("morning");
  const [foodType, setFoodType] = useState("veg");
  const [totalQuantity, setTotalQuantity] = useState("30");
  const [availableQuantity, setAvailableQuantity] = useState("30");
  const [isAvailable, setIsAvailable] = useState(true);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchFoods = async () => {
    const { data } = await supabase.from("foods").select("*").order("created_at", { ascending: false });
    if (data) setFoods(data);
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
        alert("Only JPG, PNG, and WebP images are allowed.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File) => {
    setUploadingImage(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${ext}`;
    const { data, error } = await supabase.storage.from("food-images").upload(fileName, file);
    setUploadingImage(false);
    if (error) {
      alert("Failed to upload image: " + error.message);
      throw error;
    }
    const { data: { publicUrl } } = supabase.storage.from("food-images").getPublicUrl(fileName);
    return publicUrl;
  };


  const resetForm = () => {
    setEditingId(null);
    setName(""); setPrice(""); setDescription("");
    setSession("morning"); setFoodType("veg"); setTotalQuantity("30"); setAvailableQuantity("30");
    setIsAvailable(true); setImageFile(null); setImagePreview("");
  };

  const handleEdit = (f: any) => {
    setEditingId(f.id);
    setName(f.name);
    setPrice(f.price.toString());
    setDescription(f.description || "");
    setSession(f.session || "morning");
    setFoodType(f.food_type || "veg");
    setTotalQuantity((f.total_quantity ?? f.available_quantity ?? 30).toString());
    setAvailableQuantity((f.available_quantity ?? 30).toString());
    setIsAvailable(f.is_available);
    setImagePreview(f.image_url || "");
    setImageFile(null);
  };

  const saveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return alert("Name and Price are required");
    setLoading(true);
    
    try {
      let finalImageUrl = imagePreview;
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      } else if (!editingId && !finalImageUrl) {
        alert("Please upload an image for the new food.");
        setLoading(false);
        return;
      }

      const parsedTotal = parseInt(totalQuantity);
      const parsedAvailable = parseInt(availableQuantity);

      const payload: any = {
        name,
        price: parseFloat(price),
        description,
        session,
        food_type: foodType,
        total_quantity: parsedTotal,
        available_quantity: parsedAvailable,
        is_available: isAvailable,
        image_url: finalImageUrl
      };

      if (editingId) {
        const { error } = await supabase.from("foods").update(payload).eq("id", editingId);
        if (error) throw error;
        alert("Food updated successfully!");
      } else {
        const { error } = await supabase.from("foods").insert(payload);
        if (error) throw error;
        alert("Food added successfully!");
      }
      
      resetForm();
      fetchFoods();
    } catch (err: any) {
      alert("Error saving food: " + err.message);
    }
    setLoading(false);
  };

  const deleteFood = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this food?")) return;
    const { error } = await supabase.from("foods").delete().eq("id", id);
    if (error) alert("Error deleting food: " + error.message);
    else fetchFoods();
  };

  return (
    <section className="mt-7 rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5">
      <h2 className="font-display text-2xl mb-4">Manage Foods</h2>
      
      <form onSubmit={saveFood} className="rounded-xl border border-[#dcccb8] bg-white p-5 shadow-warm-sm mb-6">
        <h3 className="font-bold text-[#294b41] mb-4">{editingId ? "Edit Food" : "Add New Food"}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col text-xs font-bold text-[#294b41]">Food Name<input required value={name} onChange={e => setName(e.target.value)} className="mt-1 rounded-xl border p-2" placeholder="Masala Dosa" /></label>
          <label className="flex flex-col text-xs font-bold text-[#294b41]">Price<input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="mt-1 rounded-xl border p-2" placeholder="50" /></label>
          <label className="flex flex-col text-xs font-bold text-[#294b41]">Total Quantity<input required type="number" min="0" value={totalQuantity} onChange={e => {
            setTotalQuantity(e.target.value);
            if (!editingId) setAvailableQuantity(e.target.value); // Sync by default when adding new
          }} className="mt-1 rounded-xl border p-2" /></label>
          <label className="flex flex-col text-xs font-bold text-[#294b41]">Available Quantity<input required type="number" min="0" value={availableQuantity} onChange={e => setAvailableQuantity(e.target.value)} className="mt-1 rounded-xl border p-2" /></label>
          
          <label className="flex flex-col text-xs font-bold text-[#294b41] sm:col-span-2">Description<input value={description} onChange={e => setDescription(e.target.value)} className="mt-1 rounded-xl border p-2" placeholder="Fresh crispy masala dosa" /></label>
          
          <label className="flex flex-col text-xs font-bold text-[#294b41]">Session
            <select value={session} onChange={e => setSession(e.target.value)} className="mt-1 rounded-xl border p-2 bg-white">
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </label>
          
          <label className="flex flex-col text-xs font-bold text-[#294b41]">Food Type
            <select value={foodType} onChange={e => setFoodType(e.target.value)} className="mt-1 rounded-xl border p-2 bg-white">
              <option value="veg">Veg</option>
              <option value="non-veg">Non-Veg</option>
            </select>
          </label>
          
          <label className="flex items-center gap-2 text-xs font-bold text-[#294b41] h-full pt-6">
            <input type="checkbox" checked={isAvailable} onChange={e => setIsAvailable(e.target.checked)} className="size-4" />
            Currently Available
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <label className="text-xs font-bold text-[#294b41]">Food Image</label>
          <div className="flex items-center gap-4">
            <div className="size-20 shrink-0 overflow-hidden rounded-xl border border-dashed border-[#dcccb8] bg-[#f9f5ef]">
              {imagePreview ? <img src={imagePreview} className="size-full object-cover" /> : <div className="grid size-full place-items-center text-xs text-[#a38e78]">No image</div>}
            </div>
            <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleImageChange} className="text-sm" />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={loading || uploadingImage}>{loading ? "Saving..." : uploadingImage ? "Uploading..." : editingId ? "Update Food" : "Add Food"}</Button>
          {editingId && <Button variant="outline" onClick={resetForm} type="button">Cancel Edit</Button>}
        </div>
      </form>

      <div className="space-y-3">
        {foods.map(f => (
          <div key={f.id} className="flex items-center justify-between rounded-xl bg-white border border-[#e3d7c5] p-3 shadow-warm-sm">
            <div className="flex items-center gap-4">
              <img src={f.image_url} className="size-12 rounded-lg object-cover" />
              <div>
                <p className="font-bold text-[#294b41]">{f.name} <span className="ml-2 text-xs text-[#ea6b42]">{money(f.price)}</span></p>
                <p className="text-xs text-[#8e7b68] mt-1 capitalize">{f.session} • {f.food_type}</p>
                <div className="mt-1.5 flex gap-2 text-[11px] font-bold">
                  <span className="rounded bg-[#f0e8dc] px-2 py-0.5 text-[#8e7b68]">{f.total_quantity ?? f.available_quantity} total</span>
                  <span className="rounded bg-[#eaf2ec] px-2 py-0.5 text-[#26735a]">{(f.total_quantity ?? f.available_quantity) - f.available_quantity} ordered</span>
                  <span className="rounded bg-[#fbeae6] px-2 py-0.5 text-[#bd5739]">{f.available_quantity} remaining</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(f)} className="rounded bg-[#f0e8dc] px-3 py-1.5 text-xs font-bold text-[#294b41]">Edit</button>
              <button onClick={() => deleteFood(f.id)} className="rounded bg-red-100 px-3 py-1.5 text-xs font-bold text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminPage({ canteenStatus }: { canteenStatus?: "OPEN" | "CLOSED" }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  const [slots, setSlots] = useState<DbPickupSlot[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [todaysPlates, setTodaysPlates] = useState(0);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [summaryMode, setSummaryMode] = useState<"total" | "prepare">("total");
  const [slotsTab, setSlotsTab] = useState<"daily" | "custom">("daily");
  const [newOrderAlert, setNewOrderAlert] = useState<Notice | null>(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const [pendingRegistrationsCount, setPendingRegistrationsCount] = useState(0);
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);

  const globalPendingCount = pendingOrdersCount + pendingEventsCount + pendingRegistrationsCount;

  const [registrationRequests, setRegistrationRequests] = useState<any[]>([]);

  const fetchRegistrationRequests = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("approval_status", "pending").eq("role", "student").order("created_at", { ascending: false });
    if (data) setRegistrationRequests(data);
  };

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const tab = search.get("tab");
    const orderId = search.get("orderId");
    
    if (tab) setActiveTab(tab);
    if (orderId && tab === "orders") {
      setHighlightOrderId(orderId);
      // Wait for DOM to render orders
      setTimeout(() => {
        const el = document.getElementById(`order-${orderId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-[#ea6b42]', 'ring-offset-2', 'ring-offset-[#fffaf0]', 'transition-all');
          setTimeout(() => el.classList.remove('ring-4', 'ring-[#ea6b42]', 'ring-offset-2', 'ring-offset-[#fffaf0]'), 3000);
        }
      }, 500);
    }
  }, [allOrders.length]); // Re-run when orders are loaded

  const fetchOrders = async (date: string) => {
    const { data } = await supabase.from("orders").select("*, items:order_items(*, foods(available_quantity))").eq("pickup_date", date).order("created_at", { ascending: false });
    if (data) {
      const mapped: Order[] = data.map((o: any) => ({
        id: o.id,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        total: o.total_amount,
        status: o.order_status,
        pickupTime: o.pickup_time,
        pickupToken: o.order_number,
        placedAt: new Date(o.created_at).toLocaleTimeString(),
        recipientName: o.recipient_name,
        recipientPhone: o.recipient_phone,
        recipientHostel: o.recipient_hostel,
        deliveryAddress: o.delivery_address,
        items: o.items.map((i: any) => ({
          id: i.food_id,
          name: i.food_name,
          price: i.price,
          quantity: i.quantity,
          availableQuantity: i.foods?.available_quantity ?? 0,
          image: "" 
        }))
      }));
      setAllOrders(mapped as any);
      setTodaysPlates(mapped.length);
      setTotalRevenue(mapped.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0));
    }
  };
  const fetchPendingCounts = async () => {
    try {
      const [ordersRes, eventsRes, profilesRes] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'placed'),
        supabase.from('event_bookings').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending').eq('role', 'student')
      ]);
      
      setPendingOrdersCount(ordersRes.count || 0);
      setPendingEventsCount(eventsRes.count || 0);
      setPendingRegistrationsCount(profilesRes.count || 0);
    } catch (err) {
      console.error("Error fetching pending counts:", err);
    }
  };


  useEffect(() => {
    fetchOrders(selectedDate);
    fetchRegistrationRequests();
    fetchPendingCounts();

    supabase.from("pickup_slots").select("*").order("start_time", { ascending: true })
      .then(({ data }) => setSlots((data as DbPickupSlot[]) || []));
    const handleNewItem = (payload: any, tableName: string) => {
      let isNewPending = false;
      if (tableName === 'orders' && payload.new.order_status === 'placed') {
        isNewPending = true;
        toast.success(`New Food Order from ${payload.new.student_name}!`, { duration: 5000 });
      }
      if (tableName === 'event_bookings' && payload.new.status === 'PENDING') {
        isNewPending = true;
        toast.success(`New Event Booking from ${payload.new.student_name}!`, { duration: 5000 });
      }
      if (tableName === 'profiles' && payload.new.approval_status === 'pending' && payload.new.role === 'student') {
        isNewPending = true;
        toast.success(`New Registration Request from ${payload.new.name}!`, { duration: 5000 });
      }

      if (isNewPending) {
        playNotificationSound();
      }
      
      fetchPendingCounts();
      if (tableName === 'orders') fetchOrders(selectedDate);
      if (tableName === 'profiles') fetchRegistrationRequests();
    };

    const channel = supabase.channel('admin-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (p) => {
        if (p.eventType === 'INSERT') handleNewItem(p, 'orders'); else fetchPendingCounts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_bookings' }, (p) => {
        if (p.eventType === 'INSERT') handleNewItem(p, 'event_bookings'); else fetchPendingCounts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (p) => {
        if (p.eventType === 'INSERT') handleNewItem(p, 'profiles'); else fetchPendingCounts();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  const handleNoticeClick = (notice: Notice) => {
    setNewOrderAlert(null);
    if (notice.order_id) {
      window.history.pushState({}, '', `${window.location.pathname}?tab=orders&orderId=${notice.order_id}`);
      setActiveTab("orders");
      setHighlightOrderId(notice.order_id);
      
      setTimeout(() => {
        const el = document.getElementById(`order-${notice.order_id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-[#ea6b42]', 'ring-offset-2', 'ring-offset-[#fffaf0]', 'transition-all');
          setTimeout(() => el.classList.remove('ring-4', 'ring-[#ea6b42]', 'ring-offset-2', 'ring-offset-[#fffaf0]'), 3000);
        }
      }, 100);
    }
  };

  const toggleCanteenStatus = async () => {
    const newStatus = canteenStatus === "OPEN" ? "CLOSED" : "OPEN";
    if (newStatus === "CLOSED") {
      if (!window.confirm("Close Canteen?\n\nNew food orders will no longer be accepted.\nStudents with active orders will receive a notification.")) return;
    }
    try {
      const { error: rpcError } = await supabase.rpc("set_canteen_status", { p_status: newStatus });
      if (rpcError) {
        console.warn("RPC failed, trying direct update", rpcError);
        const { error: updateError } = await supabase.from('canteen_settings').update({ canteen_status: newStatus }).eq('id', 1);
        if (updateError) throw updateError;
      }
    } catch (err: any) {
      alert("Network or Server error updating Canteen Status: " + err.message);
    }
  };

  const updateStatus = async (orderId: string, newStatus: Status, rejectionReason?: string) => {
    if (newStatus === "cancelled" && !window.confirm("Are you sure you want to cancel this order?")) return;
    setUpdating(orderId);
    
    if (newStatus === "accepted") {
      const { error } = await supabase.rpc('accept_order', { p_order_id: orderId });
      if (error) {
        alert("Failed to accept order. " + (error.message || "Stock might be insufficient."));
      }
    } else {
      const payload: any = { order_status: newStatus };
      if (newStatus === "rejected" && rejectionReason) {
        payload.rejection_reason = rejectionReason;
      }
      await supabase.from("orders").update(payload).eq("id", orderId);
    }
    
    await fetchOrders(selectedDate);
    setUpdating(null);
  };

  const handleReject = (orderId: string) => {
    const reason = window.prompt("Optional: Enter a reason for rejecting this order (e.g., 'no food')");
    if (reason === null) return;
    updateStatus(orderId, "rejected", reason);
  };
  const toggleSlot = async (id: string, current: boolean) => {
    await supabase.from("pickup_slots").update({ is_active: !current }).eq("id", id);
    setSlots(slots.map(s => s.id === id ? { ...s, is_active: !current } : s));
  };
  const deleteSlot = async (id: string) => {
    if (!window.confirm("Delete this slot? Ensure no active orders exist.")) return;
    await supabase.from("pickup_slots").delete().eq("id", id);
    setSlots(slots.filter(s => s.id !== id));
  };
  const createSlot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const type = f.get("type") as "DAILY" | "CUSTOM";
    const payload = { 
      slot_type: type, 
      slot_name: f.get("name") as string || null, 
      slot_date: type === "CUSTOM" ? f.get("date") as string : null, 
      start_time: f.get("start") as string, 
      end_time: f.get("end") as string 
    };
    const { data } = await supabase.from("pickup_slots").insert(payload).select().single();
    if (data) setSlots([...slots, data as DbPickupSlot]);
    form.reset();
  };
  const updateSlot = async (e: React.FormEvent<HTMLFormElement>, id: string, type: "DAILY" | "CUSTOM") => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const updates = { 
      slot_name: f.get("name") as string || null, 
      slot_date: type === "CUSTOM" ? f.get("date") as string : null, 
      start_time: f.get("start") as string, 
      end_time: f.get("end") as string 
    };
    await supabase.from("pickup_slots").update(updates).eq("id", id);
    setSlots(slots.map(s => s.id === id ? { ...s, ...updates } as DbPickupSlot : s));
    setEditingSlotId(null);
  };
  
  const filteredOrders = allOrders.filter(o => filter === "all" ? true : o.status === filter);

  const foodSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    const validStatuses = summaryMode === "total" 
      ? ["placed", "accepted", "completed"] 
      : ["placed", "accepted"];
      
    for (const order of allOrders) {
      if (validStatuses.includes(order.status)) {
        for (const item of order.items) {
          if (!summary[item.name]) summary[item.name] = 0;
          summary[item.name] += item.quantity;
        }
      }
    }
    return summary;
  }, [allOrders, summaryMode]);

  return (
    <AdminShell 
      activeTab={activeTab} 
      setActiveTab={(t) => { window.history.pushState({}, '', `${window.location.pathname}?tab=${t}`); setActiveTab(t); }} 
      counts={{
        orders: pendingOrdersCount,
        events: pendingEventsCount,
        registrations: pendingRegistrationsCount,
        total: globalPendingCount
      }}
    >
      {newOrderAlert && (
        <button onClick={() => handleNoticeClick(newOrderAlert)} className="w-full text-left mb-6 flex items-center justify-between rounded-xl bg-[#26735a] px-4 py-3 text-white shadow-md animate-rise hover:bg-[#1f5e4a] transition cursor-pointer">
          <div className="flex items-center gap-3">
            <Bell size={20} />
            <div>
              <span className="font-bold block">{newOrderAlert.title}</span>
              <span className="text-sm opacity-90 line-clamp-1">{newOrderAlert.message}</span>
            </div>
          </div>
          <ChevronRight size={18} className="opacity-70" />
        </button>
      )}

      {activeTab === "dashboard" && (
        <section className="animate-rise">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-display text-2xl text-[#294b41]">Dashboard Overview</h2>
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full ${canteenStatus === "OPEN" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {canteenStatus === "OPEN" ? "🟢 Canteen Open" : "🔴 Canteen Closed"}
              </span>
              <Button variant="outline" onClick={toggleCanteenStatus}>
                {canteenStatus === "OPEN" ? "Close Canteen" : "Open Canteen"}
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Live orders", value: allOrders.filter((o) => o.status === "placed" || o.status === "accepted").length, icon: Timer }, 
              { label: "Accepted", value: allOrders.filter((o) => o.status === "accepted").length, icon: PackageCheck }, 
              { label: "Today's plates", value: todaysPlates, icon: Soup }, 
              { label: "Revenue", value: money(totalRevenue), icon: WalletCards }
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-4 shadow-warm-sm">
                <Icon size={18} className="text-[#c35e3c]" />
                <p className="mt-5 font-display text-3xl text-[#294b41]">{value}</p>
                <p className="mt-1 text-xs font-bold text-[#92775d]">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "menus" && (
        <div className="animate-rise">
          <ManageFoods />
        </div>
      )}

      {activeTab === "orders" && (
        <section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 animate-rise">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="font-display text-2xl flex flex-wrap items-center gap-3">
            Order Management
            {pendingOrdersCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#ea6b42]/10 px-3 py-1 text-sm font-bold text-[#ea6b42]">
                <Bell size={14} className="animate-pulse" /> {pendingOrdersCount} New Orders
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-[#294b41]">Date:</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="rounded-xl border border-[#e3d7c5] bg-white px-3 py-1.5 text-sm" />
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-[#173f37] bg-[#173f37] text-white p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
            <div>
              <h3 className="font-display text-xl text-[#f6cb63]">📊 Today's Food Order Summary</h3>
              <p className="text-xs text-[#a9c0b1] mt-1">Date: {new Date(selectedDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="flex bg-[#122e28] rounded-xl p-1">
              <button onClick={() => setSummaryMode("total")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${summaryMode === "total" ? "bg-[#f6cb63] text-[#173f37]" : "text-white hover:text-[#f6cb63]"}`}>Total Ordered</button>
              <button onClick={() => setSummaryMode("prepare")} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${summaryMode === "prepare" ? "bg-[#f6cb63] text-[#173f37]" : "text-white hover:text-[#f6cb63]"}`}>Food To Prepare</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(foodSummary).length === 0 ? (
              <p className="text-sm text-[#a9c0b1]">No orders scheduled for this date.</p>
            ) : (
              Object.entries(foodSummary).map(([name, qty]) => (
                <div key={name} className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-sm">{name}</span>
                  <span className="font-bold text-[#f6cb63]">{qty}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            {["all", "accepted", "cancelled"].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f as Status | "all")} 
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold capitalize transition ${filter === f ? "border-[#173f37] bg-[#173f37] text-white" : "border-[#e3d7c5] bg-transparent text-[#846d55] hover:border-[#bd5739]"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {filteredOrders.length === 0 ? (
            <Empty title="No orders found" copy="No orders match the current filter." />
          ) : (
            filteredOrders.map((o) => (
              <div key={o.id} className="relative flex flex-col gap-5 rounded-2xl border border-[#e3d7c5] bg-white p-5 shadow-warm-sm transition-opacity" style={{ opacity: updating === o.id ? 0.5 : 1 }}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-brand text-lg font-bold text-[#bd5739]">#{o.pickupToken}</span>
                      <StatusPill status={o.status} />
                    </div>
                    <div className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#a08870]">Ordered By</p>
                        <p className="font-bold text-[#294b41]">{o.customerName || "Student"}</p>
                        <p className="text-[#846d55]">{o.customerPhone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#ea6b42]">Order For / Deliver To</p>
                        <p className="font-bold text-[#294b41]">{o.recipientName || o.customerName || "Student"}</p>
                        <p className="text-[#846d55]">{o.recipientPhone || o.customerPhone || "N/A"}</p>
                        <p className="text-xs text-[#a08870]">{o.deliveryAddress ? `${o.recipientHostel}, ${o.deliveryAddress}` : "No address"}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-[#846d55]">Placed at {o.placedAt} · Pickup: {formatTimeRange(o.pickupTime)}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-mono-brand text-lg font-bold text-[#294b41]">{money(o.total)}</p>
                    <p className="text-[11px] font-bold uppercase tracking-[.1em] text-[#a08870]">Payment: Pending</p>
                  </div>
                </div>

                <div className="rounded-xl bg-[#fcf9f2] p-4 text-sm text-[#5a4838]">
                  <ul className="space-y-1">
                    {o.items.map((i: any) => (
                      <li key={i.id} className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span><b className="font-bold">{i.quantity}x</b> {i.name}</span>
                          {o.status === "placed" && (
                            <span className="text-[10px] text-[#bd5739] font-bold">Currently Available: {i.availableQuantity}</span>
                          )}
                        </div>
                        <span>{money(i.price * i.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-[#e3d7c5] pt-4">
                  {o.status === "placed" && (
                    <>
                      <Button variant="primary" onClick={() => updateStatus(o.id, "accepted")} disabled={updating === o.id}>
                        Accept Order
                      </Button>
                      <button onClick={() => handleReject(o.id)} disabled={updating === o.id} className="rounded-xl px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50">
                        Reject
                      </button>
                    </>
                  )}
                  {o.status === "accepted" && (
                    <Button variant="primary" onClick={() => updateStatus(o.id, "completed")} disabled={updating === o.id}>
                      Mark as Completed
                    </Button>
                  )}
                  {o.status === "accepted" && (
                    <button onClick={() => updateStatus(o.id, "cancelled")} disabled={updating === o.id} className="rounded-xl px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50">
                      Cancel Order
                    </button>
                  )}
                  {(o.status === "cancelled" || o.status === "rejected") && (o as any).rejection_reason && (
                    <p className="text-xs text-red-500 font-bold w-full mt-2">Reason: {(o as any).rejection_reason}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      )}

      {activeTab === "slots" && (
      <section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 animate-rise">
        <h2 className="font-display text-2xl mb-4">Manage Pickup Schedule</h2>
        
        <div className="flex gap-2 mb-6">
          <button onClick={() => setSlotsTab("daily")} className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${slotsTab === "daily" ? "bg-[#173f37] text-white" : "bg-[#eaf2ec] text-[#294b41] hover:bg-[#d5e3d9]"}`}>Daily Routine</button>
          <button onClick={() => setSlotsTab("custom")} className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${slotsTab === "custom" ? "bg-[#173f37] text-white" : "bg-[#eaf2ec] text-[#294b41] hover:bg-[#d5e3d9]"}`}>Custom Date Slots</button>
        </div>
        
        {slotsTab === "daily" ? (
          <div>
            <form onSubmit={createSlot} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl bg-[#f7eee1] p-4 border border-[#e3d7c5]">
              <input type="hidden" name="type" value="DAILY" />
              <label className="flex flex-col text-xs font-bold text-[#294b41]">Slot Name<input required name="name" placeholder="e.g. Lunch" className="mt-1 rounded-xl border border-[#dcccb8] bg-white p-2 text-sm outline-none focus:border-[#ea6b42]" /></label>
              <label className="flex flex-col text-xs font-bold text-[#294b41]">Start Time<input required name="start" type="time" className="mt-1 rounded-xl border border-[#dcccb8] bg-white p-2 text-sm outline-none focus:border-[#ea6b42]" /></label>
              <label className="flex flex-col text-xs font-bold text-[#294b41]">End Time<input required name="end" type="time" className="mt-1 rounded-xl border border-[#dcccb8] bg-white p-2 text-sm outline-none focus:border-[#ea6b42]" /></label>
              <Button type="submit" className="h-[38px] px-4">+ Add Daily Routine Slot</Button>
            </form>
            
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-[.14em] text-[#bb6a42]">Daily Routine</div>
              {slots.filter(s => s.slot_type === "DAILY").map(s => (
                <div key={s.id} className="rounded-xl border border-[#e3d7c5] bg-white px-4 py-4 text-sm shadow-warm-sm">
                  {editingSlotId === s.id ? (
                    <form onSubmit={(e) => updateSlot(e, s.id, "DAILY")} className="flex flex-wrap items-center gap-2">
                      <input required name="name" placeholder="Slot Name" defaultValue={s.slot_name || ""} className="rounded-lg border border-[#dcccb8] bg-white p-1 text-sm outline-none focus:border-[#ea6b42]" />
                      <input required name="start" type="time" defaultValue={s.start_time} className="rounded-lg border border-[#dcccb8] bg-white p-1 text-sm outline-none focus:border-[#ea6b42]" />
                      <input required name="end" type="time" defaultValue={s.end_time} className="rounded-lg border border-[#dcccb8] bg-white p-1 text-sm outline-none focus:border-[#ea6b42]" />
                      <Button type="submit" className="h-[28px] px-3 py-0 text-xs">Save</Button>
                      <button type="button" onClick={() => setEditingSlotId(null)} className="text-xs text-red-500 font-bold ml-1">Cancel</button>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-[#ea6b42] text-base mb-1">🔄 {s.slot_name || "Daily Slot"}</h3>
                        <p className="font-mono-brand text-[#294b41] text-[15px]">{format12Hour(s.start_time)} - {format12Hour(s.end_time)}</p>
                        <p className="text-xs text-[#846d55] mt-1 font-bold">Status: {s.is_active ? <span className="text-[#26735a]">Active</span> : <span className="text-red-500">Disabled</span>}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingSlotId(s.id)} className="rounded px-3 py-1.5 text-xs font-bold bg-[#eaf2ec] text-[#294b41] hover:bg-[#dceee5]">Edit</button>
                        <button onClick={() => toggleSlot(s.id, s.is_active)} className={`rounded px-3 py-1.5 text-xs font-bold ${s.is_active ? 'bg-[#f7eee1] text-[#9a622c] hover:bg-[#e3d7c5]' : 'bg-[#dceee5] text-[#26735a]'}`}>
                          {s.is_active ? "Disable" : "Enable"}
                        </button>
                        <button onClick={() => deleteSlot(s.id)} className="rounded px-3 py-1.5 text-xs font-bold bg-[#fff0e9] text-[#ea6b42] hover:bg-[#ffdfcf]">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <form onSubmit={createSlot} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl bg-[#f7eee1] p-4 border border-[#e3d7c5]">
              <input type="hidden" name="type" value="CUSTOM" />
              <label className="flex flex-col text-xs font-bold text-[#294b41]">Date<input required name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="mt-1 rounded-xl border border-[#dcccb8] bg-white p-2 text-sm outline-none focus:border-[#ea6b42]" /></label>
              <label className="flex flex-col text-xs font-bold text-[#294b41]">Name (Optional)<input name="name" placeholder="e.g. Festival" className="mt-1 rounded-xl border border-[#dcccb8] bg-white p-2 text-sm outline-none focus:border-[#ea6b42]" /></label>
              <label className="flex flex-col text-xs font-bold text-[#294b41]">Start Time<input required name="start" type="time" className="mt-1 rounded-xl border border-[#dcccb8] bg-white p-2 text-sm outline-none focus:border-[#ea6b42]" /></label>
              <label className="flex flex-col text-xs font-bold text-[#294b41]">End Time<input required name="end" type="time" className="mt-1 rounded-xl border border-[#dcccb8] bg-white p-2 text-sm outline-none focus:border-[#ea6b42]" /></label>
              <Button type="submit" className="h-[38px] px-4">+ Add Custom Slot</Button>
            </form>
            
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-[.14em] text-[#bb6a42]">Custom Date Slots</div>
              {slots.filter(s => s.slot_type === "CUSTOM").sort((a, b) => (b.slot_date || "").localeCompare(a.slot_date || "")).map(s => (
                <div key={s.id} className="rounded-xl border border-[#e3d7c5] bg-white px-4 py-4 text-sm shadow-warm-sm">
                  {editingSlotId === s.id ? (
                    <form onSubmit={(e) => updateSlot(e, s.id, "CUSTOM")} className="flex flex-wrap items-center gap-2">
                      <input required name="date" type="date" defaultValue={s.slot_date || ""} className="rounded-lg border border-[#dcccb8] bg-white p-1 text-sm outline-none focus:border-[#ea6b42]" />
                      <input name="name" placeholder="Name" defaultValue={s.slot_name || ""} className="rounded-lg border border-[#dcccb8] bg-white p-1 text-sm outline-none focus:border-[#ea6b42]" />
                      <input required name="start" type="time" defaultValue={s.start_time} className="rounded-lg border border-[#dcccb8] bg-white p-1 text-sm outline-none focus:border-[#ea6b42]" />
                      <input required name="end" type="time" defaultValue={s.end_time} className="rounded-lg border border-[#dcccb8] bg-white p-1 text-sm outline-none focus:border-[#ea6b42]" />
                      <Button type="submit" className="h-[28px] px-3 py-0 text-xs">Save</Button>
                      <button type="button" onClick={() => setEditingSlotId(null)} className="text-xs text-red-500 font-bold ml-1">Cancel</button>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-[#ea6b42] text-base mb-1">📅 {s.slot_name || "Custom Slot"} <span className="text-[#846d55] text-sm">({new Date(s.slot_date || "").toLocaleDateString()})</span></h3>
                        <p className="font-mono-brand text-[#294b41] text-[15px]">{format12Hour(s.start_time)} - {format12Hour(s.end_time)}</p>
                        <p className="text-xs text-[#846d55] mt-1 font-bold">Status: {s.is_active ? <span className="text-[#26735a]">Active</span> : <span className="text-red-500">Disabled</span>}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingSlotId(s.id)} className="rounded px-3 py-1.5 text-xs font-bold bg-[#eaf2ec] text-[#294b41] hover:bg-[#dceee5]">Edit</button>
                        <button onClick={() => toggleSlot(s.id, s.is_active)} className={`rounded px-3 py-1.5 text-xs font-bold ${s.is_active ? 'bg-[#f7eee1] text-[#9a622c] hover:bg-[#e3d7c5]' : 'bg-[#dceee5] text-[#26735a]'}`}>
                          {s.is_active ? "Disable" : "Enable"}
                        </button>
                        <button onClick={() => deleteSlot(s.id)} className="rounded px-3 py-1.5 text-xs font-bold bg-[#fff0e9] text-[#ea6b42] hover:bg-[#ffdfcf]">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      )}

      {activeTab === "event-bookings" && (
        <section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 animate-rise">
          <h2 className="font-display text-2xl mb-4 flex flex-wrap items-center gap-3">
            Manage Event Bookings
            {pendingEventsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#ea6b42]/10 px-3 py-1 text-sm font-bold text-[#ea6b42]">
                <Bell size={14} className="animate-pulse" /> {pendingEventsCount} New Bookings
              </span>
            )}
          </h2>
          <AdminEventBookings />
        </section>
      )}

      {activeTab === "celebrations" && (
        <section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 animate-rise">
          <h2 className="font-display text-2xl mb-4">Manage Celebration Items</h2>
          <AdminCelebrationItems />
        </section>
      )}

      {activeTab === "requests" && (
        <section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 animate-rise">
          <h2 className="font-display text-2xl mb-4 flex flex-wrap items-center gap-3">
            Registration Requests
            {pendingRegistrationsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#ea6b42]/10 px-3 py-1 text-sm font-bold text-[#ea6b42]">
                <Bell size={14} className="animate-pulse" /> {pendingRegistrationsCount} New Requests
              </span>
            )}
          </h2>
          <AdminRegistrationRequests />
        </section>
      )}
    </AdminShell>
  );
}

function AdminRegistrationRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
    const channel = supabase.channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchRequests();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const [filter, setFilter] = useState("all");

  const fetchRequests = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'student');
    setRequests(data || []);
    setLoading(false);
  };

  const handleAction = async (studentId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase.rpc('approve_student', {
        p_student_id: studentId,
        p_status: status
      });
      if (error) throw error;
      setRequests(prev => prev.map(r => r.id === studentId ? { ...r, approval_status: status } : r));
      alert(`Student ${status} successfully!`);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="text-[#846d55]">Loading requests...</div>;

  const filteredRequests = requests.filter(r => {
    if (filter === "all") return true;
    if (filter === "accepted") return r.approval_status === "approved";
    if (filter === "cancelled") return r.approval_status === "rejected";
    return true;
  });

  return (
    <div className="grid gap-4">
      <div className="flex gap-2 mb-2">
        {["all", "accepted", "cancelled"].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)} 
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold capitalize transition ${filter === f ? "border-[#173f37] bg-[#173f37] text-white" : "border-[#e3d7c5] bg-transparent text-[#846d55] hover:border-[#bd5739]"}`}
          >
            {f}
          </button>
        ))}
      </div>
      
      {filteredRequests.length === 0 && (
        <Empty title="No requests found" copy="No student registrations match this filter." />
      )}

      {filteredRequests.map(req => (
        <div key={req.id} className="flex flex-col gap-4 rounded-xl border border-[#dcccb8] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-[#173f37] text-lg">{req.name}</h3>
            <p className="text-sm text-[#846d55]">{req.email}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-[#ea6b42]">
              <span className="rounded bg-[#fff0e9] px-2 py-1">{req.department || 'N/A'}</span>
              <span className="rounded bg-[#fff0e9] px-2 py-1">{req.hostel_type || 'boys'} hostel</span>
              <span className="rounded bg-[#fff0e9] px-2 py-1">{req.phone || 'N/A'}</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {req.approval_status === 'pending' ? (
              <>
                <button onClick={() => handleAction(req.id, 'rejected')} className="rounded-lg bg-[#fff0e9] px-4 py-2 text-sm font-bold text-[#ea6b42] transition hover:bg-[#ffdfcf]">Reject</button>
                <button onClick={() => handleAction(req.id, 'approved')} className="rounded-lg bg-[#26735a] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1a5240]">Approve</button>
              </>
            ) : (
              <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${req.approval_status === 'approved' ? 'bg-[#eaf2ec] text-[#26735a]' : 'bg-[#fff0e9] text-[#ea6b42]'}`}>
                {req.approval_status.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Router({ profile, foods, cart, eventCart, notices, setNotices, canteenStatus }: { profile: any; foods: Food[]; cart: ReturnType<typeof useCart>; eventCart: ReturnType<typeof useEventCart>; notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>; canteenStatus?: "OPEN" | "CLOSED" }) { 
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (profile.role === 'admin') {
      // Force admin to stay on /admin
      if (location !== '/admin') {
        navigate('/admin');
      }
    } else {
      // Force student away from /admin
      if (location.startsWith('/admin')) {
        navigate('/');
      } else if (!profile.name || !profile.phone) {
        if (location !== "/profile") {
          navigate("/profile");
        }
      }
    }
  }, [profile, location, navigate]);

  useEffect(() => {
    if (!profile.id) return;
    
    supabase.from("notifications").select("*").eq("recipient_id", profile.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setNotices(data as Notice[]);
      });

    const channel = supabase.channel('public:notifications:student')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${profile.id}` }, (payload) => {
        setNotices(prev => [payload.new as Notice, ...prev]);
        try { new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=notification-sound-7062.mp3").play().catch(() => {}); } catch(e) {}
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${profile.id}` }, (payload) => {
        setNotices(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notice : n));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id, setNotices]);

  return <Switch>
    <Route path="/"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><Home cart={cart} foods={foods} /></Shell></Route>
    <Route path="/menu"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><MenuPage cart={cart} foods={foods} /></Shell></Route>
    <Route path="/menu/:foodId"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><FoodDetails cart={cart} foods={foods} /></Shell></Route>
    <Route path="/cart"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><CartPage cart={cart} /></Shell></Route>
    <Route path="/checkout"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><CheckoutPage cart={cart} canteenStatus={canteenStatus} /></Shell></Route>
    <Route path="/order-success/:orderNumber"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><SuccessPage /></Shell></Route>
    <Route path="/orders"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><OrdersPage /></Shell></Route>
    <Route path="/orders/:orderNumber"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><TrackingPage /></Shell></Route>
    <Route path="/notifications"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><NotificationsPage notices={notices} setNotices={setNotices} /></Shell></Route>
    <Route path="/profile"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><ProfilePage /></Shell></Route>
    <Route path="/events"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><EventBookingIntro /></Shell></Route>
    <Route path="/events/book"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><EventBookingWizard eventCart={eventCart} foods={foods} /></Shell></Route>
    <Route path="/events/my-bookings"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><MyEventBookingsPage /></Shell></Route>
    <Route path="/admin"><AdminPage canteenStatus={canteenStatus} /></Route>
    <Route component={NotFound} />
  </Switch>; 
}
import { AuthPage, PendingApprovalPage, RejectedPage } from "./AuthPage";

function App() { 
  const cart = useCart(); 
  const eventCart = useEventCart();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [canteenStatus, setCanteenStatus] = useState<"OPEN" | "CLOSED">("OPEN");
  
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Fetch profile
    supabase.from("profiles").select("*").eq("id", session.user.id).single()
      .then(({ data, error }) => {
        if (data) {
          setProfile(data);
          localStorage.setItem("canteenflow-profile", JSON.stringify(data));
        }
        if (error) console.error("Error fetching profile:", error);
      });
      
    // Subscribe to profile changes (approval status)
    const channel = supabase.channel(`public:profiles:${session.user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` }, (payload) => {
        setProfile((prev: any) => ({ ...prev, ...payload.new }));
      }).subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    supabase.from("canteen_settings").select("canteen_status").eq("id", 1).single().then(({ data }) => {
      if (data) setCanteenStatus(data.canteen_status as "OPEN" | "CLOSED");
    });
    
    const channel = supabase.channel('public:canteen_settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'canteen_settings' }, (payload) => {
        const newStatus = payload.new.canteen_status as "OPEN" | "CLOSED";
        setCanteenStatus(newStatus);
        
        if (profile?.role === 'student' && !window.location.pathname.startsWith('/admin')) {
          playNotificationSound();
          toast.info(`Canteen is now ${newStatus}!`, { duration: 5000 });
        }
      }).subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.role]);

  useEffect(() => {
    supabase.from("foods").select("*")
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else if (data) {
          const mapped = data.map(item => ({
            id: item.id || Math.random().toString(),
            name: item.name || "Unknown Item",
            description: item.description || "",
            price: typeof item.price === "number" ? item.price : 0,
            category: item.category || "Menu Item", // fallback since DB uses category_id
            image: item.image_url || item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85",
            isVeg: item.food_type === "veg" || item.is_veg === true || item.isVeg === true,
            rating: typeof item.rating === "number" ? item.rating : 4.5, // safe fallback to prevent toFixed crash
            ratingCount: item.rating_count || item.ratingCount || 0,
            isAvailable: item.is_available ?? item.isAvailable ?? true,
            isPopular: item.is_popular ?? item.isPopular ?? false,
            preparationTime: item.preparation_time ?? item.preparationTime ?? 15,
            availableQuantity: item.available_quantity ?? item.availableQuantity ?? 1,
            session: item.session || "morning"
          })) as (Food & { availableQuantity: number })[];
          const availableFoods = mapped.filter(f => f.isAvailable === true && f.availableQuantity > 0);
          setFoods(availableFoods);
        }
        setLoading(false);
      });

  }, []);

  if (loading) {
    return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><div className="flex min-h-[50vh] flex-col items-center justify-center animate-pulse text-[#24493f]"><Soup size={48} className="mb-4 text-[#ea6b42]" /><h2 className="font-display text-2xl">Loading menu...</h2></div></Shell></WouterRouter>;
  }

  if (error) {
    return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><div className="flex min-h-[50vh] flex-col items-center justify-center text-red-600"><h2 className="font-display text-2xl">Something went wrong</h2><p className="mt-2">{error}</p></div></Shell></WouterRouter>;
  }

  if (!session) {
    return <AuthPage />;
  }

  if (!profile) {
    return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><div className="flex min-h-[100dvh] flex-col items-center justify-center animate-pulse text-[#24493f] bg-[#f7f0e5]"><Soup size={48} className="mb-4 text-[#ea6b42]" /><h2 className="font-display text-2xl">Loading Profile...</h2></div></WouterRouter>;
  }

  if (profile.role !== 'admin') {
    if (profile.approval_status === 'pending') {
      return <PendingApprovalPage />;
    }
    if (profile.approval_status === 'rejected') {
      return <RejectedPage />;
    }
  }

  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><ErrorBoundary><Router profile={profile} foods={foods} cart={cart} eventCart={eventCart} notices={notices} setNotices={setNotices} canteenStatus={canteenStatus} /></ErrorBoundary></WouterRouter>; 
}
export default App;