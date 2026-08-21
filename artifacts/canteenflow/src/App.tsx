import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Bell, CalendarClock, Check, ChevronRight, CreditCard, Flame, History, Home as HomeIcon, Info,
  LogOut, MapPin, Minus, MoreHorizontal, PackageCheck, Plus, QrCode, ReceiptText, RefreshCw,
  Search, Settings, ShieldCheck, ShoppingBag, Soup, Star, Store, Ticket, Timer, Trash2,
  UserRound, WalletCards, Zap
} from 'lucide-react';
import {
  getGetMenuQueryKey, getGetNotificationsQueryKey, getGetOrderQueryKey, getGetOrdersQueryKey,
  getGetPickupSlotsQueryKey, useCreateOrder, useGetMenu, useGetNotifications, useGetOrder,
  useGetOrders, useGetPickupSlots, useMarkNotificationsRead
} from '@workspace/api-client-react';
import type { FoodItem, Order, PickupSlot } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';

const queryClient = new QueryClient();
const money = (value: number) => `₹${value.toFixed(2)}`;
const timeLabel = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};
const dateLabel = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

type CartLine = Pick<FoodItem, 'id' | 'name' | 'price' | 'image' | 'category'> & { quantity: number };
type PaymentMethod = 'upi' | 'cash';

const sampleImage = (item: Pick<FoodItem, 'name' | 'category'>) => {
  const colors: Record<string, string> = {
    'Breakfast': 'from-[#fbd59c] via-[#ee9368] to-[#9a483b]',
    'Lunch': 'from-[#f5b76f] via-[#e67955] to-[#27675b]',
    'Snacks': 'from-[#ffe7ab] via-[#edb24c] to-[#8b5a30]',
    'Beverages': 'from-[#c8e4bd] via-[#67a891] to-[#246054]',
    'Dinner': 'from-[#f7c6a8] via-[#c87760] to-[#4f3e50]',
  };
  return colors[item.category] ?? 'from-[#fbd59c] via-[#ee9368] to-[#27675b]';
};

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" data-testid="link-wordmark">
      <span className={`grid size-9 place-items-center rounded-[11px] ${light ? 'bg-[#f6cb63] text-[#173f37]' : 'bg-[#173f37] text-[#f6cb63]'} shadow-warm-sm`}>
        <Soup size={19} strokeWidth={2.7} />
      </span>
      <span className={`font-bold tracking-[-.045em] text-[19px] ${light ? 'text-[#fff8e8]' : 'text-[#173f37]'}`}>Canteen<span className={light ? 'text-[#f6cb63]' : 'text-[#e9653d]'}>Flow</span></span>
    </Link>
  );
}

function Button({ children, className = '', variant = 'primary', onClick, disabled = false, type = 'button', testId }: {
  children: ReactNode; className?: string; variant?: 'primary' | 'quiet' | 'outline' | 'dark' | 'danger'; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit'; testId?: string;
}) {
  const variants = {
    primary: 'bg-[#ea6b42] text-[#fff9ec] hover:bg-[#d85836] shadow-[0_7px_18px_rgba(215,83,48,.2)]',
    quiet: 'bg-[#f4ead9] text-[#6e4d35] hover:bg-[#eadcc5]',
    outline: 'border border-[#d9c9b1] bg-transparent text-[#604a36] hover:bg-[#f4ead9]',
    dark: 'bg-[#173f37] text-[#fff9ec] hover:bg-[#21564b]',
    danger: 'bg-[#f6dfd9] text-[#ae4735] hover:bg-[#f1cec5]',
  };
  return <button type={type} disabled={disabled} onClick={onClick} data-testid={testId} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}>{children}</button>;
}

function IconButton({ children, label, testId }: { children: ReactNode; label: string; testId: string }) {
  return <span aria-label={label} data-testid={testId} className="relative grid size-10 place-items-center rounded-xl border border-[#ddceb9] bg-[#fffaf0] text-[#6a4e38] transition hover:-translate-y-0.5 hover:bg-[#f5ead9]">{children}</span>;
}

function StatusPill({ status }: { status: string }) {
  const labels: Record<string, string> = { placed: 'Placed', accepted: 'Accepted', preparing: 'Cooking now', ready: 'Ready for pickup', completed: 'Completed' };
  const colors: Record<string, string> = { placed: 'bg-[#f6ead0] text-[#8b6528]', accepted: 'bg-[#dceee5] text-[#26735a]', preparing: 'bg-[#ffe1c6] text-[#a7512f]', ready: 'bg-[#d5e8e2] text-[#19594d]', completed: 'bg-[#e6e0d8] text-[#716252]' };
  return <span data-testid={`status-pill-${status}`} className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${colors[status] ?? colors.placed}`}>{labels[status] ?? status}</span>;
}

function FoodVisual({ item, className = '' }: { item: Pick<FoodItem, 'name' | 'category' | 'image'>; className?: string }) {
  const hasImage = Boolean(item.image);
  return <div className={`relative overflow-hidden bg-gradient-to-br ${sampleImage(item)} ${className}`}>
    {hasImage ? <img src={item.image} alt="" className="size-full object-cover" /> : <><span className="absolute -right-4 -top-7 size-24 rounded-full border-[12px] border-white/15" /><span className="absolute bottom-3 left-3 font-display text-4xl text-white/85">{item.name.charAt(0)}</span></>}
  </div>;
}

function PageIntro({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return <div className="mb-7 animate-rise">
    {eyebrow && <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.17em] text-[#bb6a42]"><span className="h-px w-5 bg-[#bb6a42]" />{eyebrow}</div>}
    <h1 className="font-display text-[clamp(2.35rem,5vw,4rem)] leading-[.94] tracking-[-.045em] text-[#24493f]">{title}</h1>
    {sub && <p className="mt-3 max-w-xl text-[15px] leading-6 text-[#7a6651]">{sub}</p>}
  </div>;
}

function QueryState({ isLoading, isError, onRetry, children, empty, testId }: { isLoading?: boolean; isError?: boolean; onRetry: () => void; children: ReactNode; empty: ReactNode; testId: string }) {
  if (isLoading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid={`loading-${testId}`}>{[1, 2, 3].map((item) => <div key={item} className="overflow-hidden rounded-2xl border border-[#e3d7c5] bg-[#fffaf0]"><div className="skeleton h-40" /><div className="space-y-3 p-4"><div className="skeleton h-4 w-3/4 rounded" /><div className="skeleton h-3 w-1/2 rounded" /><div className="skeleton h-9 rounded-lg" /></div></div>)}</div>;
  if (isError) return <div className="rounded-2xl border border-[#eccbc0] bg-[#fff3ec] p-8 text-center" data-testid={`error-${testId}`}><Info className="mx-auto mb-3 text-[#c96142]" /><p className="font-bold text-[#6f3e31]">Couldn’t load this just now.</p><p className="mt-1 text-sm text-[#946b5b]">The canteen may be taking a breather. Try again.</p><Button variant="outline" className="mt-4" onClick={onRetry} testId={`button-retry-${testId}`}><RefreshCw size={15} /> Retry</Button></div>;
  return <>{children || empty}</>;
}

function Shell({ children, cartCount, unreadCount }: { children: ReactNode; cartCount: number; unreadCount: number }) {
  const [location] = useLocation();
  const links = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/menu', label: 'Menu', icon: Soup },
    { href: '/orders', label: 'Orders', icon: ReceiptText },
    { href: '/notifications', label: 'Alerts', icon: Bell },
  ];
  return <div className="grain min-h-[100dvh] bg-[#f7f0e5]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col bg-[#173f37] px-5 py-6 text-[#fff8e8] lg:flex">
      <Wordmark light />
      <div className="mt-12 rounded-2xl border border-white/10 bg-white/[.07] p-4">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.13em] text-[#f6cb63]"><Zap size={14} fill="currentColor" /> Live canteen</div>
        <p className="mt-2 text-sm leading-5 text-[#d2e1d7]">Pickup is moving fast today. Order before the next bell.</p>
      </div>
      <nav className="mt-8 space-y-1.5" aria-label="Main navigation">
        {links.map(({ href, label, icon: Icon }) => <Link href={href} key={href} data-testid={`link-nav-${label.toLowerCase()}`} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${location === href ? 'bg-[#f6cb63] text-[#173f37]' : 'text-[#d2e1d7] hover:bg-white/10 hover:text-white'}`}><Icon size={18} /><span>{label}</span>{label === 'Alerts' && unreadCount > 0 && <span className="ml-auto grid size-5 place-items-center rounded-full bg-[#ea6b42] text-[10px] text-white">{unreadCount}</span>}</Link>)}
      </nav>
      <div className="mt-auto space-y-1.5">
        <Link href="/profile" data-testid="link-nav-profile" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${location === '/profile' ? 'bg-white/10 text-white' : 'text-[#d2e1d7] hover:bg-white/10'}`}><UserRound size={18} /> Profile</Link>
        <Link href="/admin" data-testid="link-nav-admin" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#d2e1d7] transition hover:bg-white/10"><Store size={18} /> Canteen desk</Link>
      </div>
    </aside>
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#e3d7c5] bg-[#f7f0e5]/95 px-5 backdrop-blur lg:ml-[236px] lg:px-10">
      <div className="lg:hidden"><Wordmark /></div>
      <div className="hidden text-sm text-[#88735d] lg:block">{location === '/' ? 'Tuesday, 18 June' : <span className="capitalize">{location.replace('/', '').replace('-', ' ')}</span>}</div>
      <div className="ml-auto flex items-center gap-2.5">
        <Link href="/notifications" className="lg:hidden"><IconButton label="Notifications" testId="button-mobile-notifications"><Bell size={18} />{unreadCount > 0 && <span className="absolute ml-6 mt-[-22px] size-2 rounded-full bg-[#ea6b42]" />}</IconButton></Link>
        <Link href="/cart" data-testid="link-cart-header" className="relative flex items-center gap-2 rounded-xl bg-[#173f37] px-3.5 py-2.5 text-sm font-bold text-[#fff8e8] shadow-warm-sm transition hover:bg-[#23564c]"><ShoppingBag size={17} /><span className="hidden sm:inline">Your tray</span>{cartCount > 0 && <span data-testid="text-cart-count" className="grid size-5 place-items-center rounded-full bg-[#f6cb63] text-[10px] text-[#173f37]">{cartCount}</span>}</Link>
      </div>
    </header>
    <main className="pb-24 lg:ml-[236px] lg:pb-10"><div className="mx-auto max-w-[1230px] px-5 py-8 lg:px-10 lg:py-11">{children}</div></main>
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-[72px] items-center justify-around border-t border-[#e3d7c5] bg-[#fffaf0]/95 px-3 backdrop-blur lg:hidden">
      {links.slice(0, 4).map(({ href, label, icon: Icon }) => <Link href={href} key={href} data-testid={`link-mobile-${label.toLowerCase()}`} className={`relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold ${location === href ? 'text-[#df603b]' : 'text-[#8c7660]'}`}><Icon size={19} /><span>{label}</span>{label === 'Alerts' && unreadCount > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-[#ea6b42]" />}</Link>)}
    </nav>
  </div>;
}

function useCart() {
  const [cart, setCart] = useState<CartLine[]>(() => {
    try { return JSON.parse(localStorage.getItem('canteenflow-cart') ?? '[]') as CartLine[]; } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('canteenflow-cart', JSON.stringify(cart)); }, [cart]);
  const add = (food: FoodItem) => setCart((current) => {
    const found = current.find((line) => line.id === food.id);
    return found ? current.map((line) => line.id === food.id ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { id: food.id, name: food.name, price: food.price, image: food.image, category: food.category, quantity: 1 }];
  });
  const change = (id: string, delta: number) => setCart((current) => current.map((line) => line.id === id ? { ...line, quantity: line.quantity + delta } : line).filter((line) => line.quantity > 0));
  const remove = (id: string) => setCart((current) => current.filter((line) => line.id !== id));
  const clear = () => setCart([]);
  return { cart, add, change, remove, clear, count: cart.reduce((sum, item) => sum + item.quantity, 0), total: cart.reduce((sum, item) => sum + item.quantity * item.price, 0) };
}

function Home({ cart }: { cart: ReturnType<typeof useCart> }) {
  const menu = useGetMenu({ query: { queryKey: getGetMenuQueryKey() } });
  const popular = useMemo(() => (menu.data ?? []).filter((item) => item.isPopular).slice(0, 3), [menu.data]);
  return <div className="space-y-12">
    <section className="relative overflow-hidden rounded-[28px] bg-[#173f37] px-6 py-10 text-[#fff8e8] shadow-warm lg:px-12 lg:py-14">
      <div className="absolute -right-20 -top-28 size-[330px] rounded-full border-[42px] border-[#f6cb63]/20" /><div className="absolute bottom-[-120px] right-[21%] size-[260px] rounded-full border-[34px] border-[#ea6b42]/20" />
      <div className="relative max-w-[670px] animate-rise"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f6cb63]/30 bg-[#f6cb63]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#f6cb63]"><Flame size={14} fill="currentColor" /> Straight from the hostel canteen</div>
        <h1 className="font-display text-[clamp(3.4rem,7vw,6.8rem)] leading-[.86] tracking-[-.055em]">Skip the queue.<br /><em className="text-[#f6cb63]">Keep the good mood.</em></h1>
        <p className="mt-6 max-w-[480px] text-[16px] leading-7 text-[#d5e3d9]">Your favourite canteen plates, ordered before the bell rings. Pick a window, walk in, walk out.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3"><Link href="/menu" data-testid="link-start-order" className="inline-flex items-center gap-2 rounded-xl bg-[#f6cb63] px-5 py-3 text-sm font-bold text-[#173f37] transition hover:bg-[#ffda7d]"><ShoppingBag size={17} /> Start an order <ChevronRight size={16} /></Link><span className="flex items-center gap-2 text-xs text-[#b9d2c5]"><ShieldCheck size={16} className="text-[#f6cb63]" /> No queue, no guesswork</span></div>
      </div>
      <div className="relative mt-10 grid max-w-[500px] grid-cols-3 gap-2.5 sm:absolute sm:bottom-10 sm:right-10 sm:mt-0 sm:w-[390px]"><div className="food-photo h-36 rotate-[-3deg] rounded-2xl border-4 border-[#fff8e8]/20 p-3 sm:h-44"><span className="font-display text-3xl text-white">Today’s<br />comfort</span></div><div className="food-photo h-36 translate-y-5 rotate-[4deg] rounded-2xl border-4 border-[#fff8e8]/20 bg-gradient-to-br from-[#c2dba7] via-[#ebbb62] to-[#d76845] p-3 sm:h-44"><span className="font-mono-brand text-[10px] font-bold uppercase tracking-widest text-white/90">ready in<br />12 min</span></div><div className="food-photo h-36 rotate-[-1deg] rounded-2xl border-4 border-[#fff8e8]/20 bg-gradient-to-br from-[#f4c3b5] via-[#dd795d] to-[#1f5e51] p-3 sm:h-44"><span className="absolute bottom-3 font-display text-2xl text-white">Made<br />nearby.</span></div></div>
    </section>
    <section className="grid gap-4 sm:grid-cols-3">
      {[{ icon: CalendarClock, title: 'Choose your window', copy: 'Claim a real pickup time, not a vague ETA.' }, { icon: Ticket, title: 'Get a tiny token', copy: 'One code gets your plate moving at the counter.' }, { icon: PackageCheck, title: 'Track the handoff', copy: 'Know when it is cooking, ready, and yours.' }].map(({ icon: Icon, title, copy }, index) => <div key={title} className={`animate-rise delay-${index + 1} rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 shadow-warm-sm`}><div className="mb-5 grid size-10 place-items-center rounded-xl bg-[#f6cb63]/35 text-[#9a622c]"><Icon size={19} /></div><h2 className="font-bold text-[#294b41]">{title}</h2><p className="mt-1.5 text-sm leading-5 text-[#88735d]">{copy}</p></div>)}
    </section>
    <section><div className="mb-5 flex items-end justify-between"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.17em] text-[#bb6a42]"><span className="h-px w-5 bg-[#bb6a42]" />On the counter today</div><h2 className="font-display text-4xl tracking-[-.04em] text-[#24493f]">Popular with your hostel</h2></div><Link href="/menu" data-testid="link-see-menu" className="hidden items-center gap-1 text-sm font-bold text-[#c65d3c] sm:flex">See full menu <ChevronRight size={16} /></Link></div>
      <QueryState isLoading={menu.isLoading} isError={menu.isError} onRetry={() => menu.refetch()} testId="home-menu" empty={<Empty title="Menu is taking a minute" copy="Check back when the first batch is out." />}>{popular.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{popular.map((item) => <FoodCard key={item.id} item={item} onAdd={() => cart.add(item)} />)}</div> : null}</QueryState>
      <Link href="/menu" data-testid="link-see-menu-mobile" className="mt-5 flex items-center justify-center gap-1 text-sm font-bold text-[#c65d3c] sm:hidden">See full menu <ChevronRight size={16} /></Link>
    </section>
    <section className="flex flex-col gap-6 rounded-[24px] border border-[#e3d7c5] bg-[#f0e5d4] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div><p className="font-mono-brand text-[11px] font-bold uppercase tracking-[.16em] text-[#a15b39]">Small promise, big difference</p><h2 className="mt-2 font-display text-4xl leading-none text-[#24493f]">More time for the<br /><em>important stuff.</em></h2></div><div className="max-w-sm text-sm leading-6 text-[#78634d]"><p>Late to class? Early to practice? CanteenFlow keeps the food bit predictable, so the rest of your day can stay gloriously unplanned.</p><Link href="/profile" data-testid="link-profile-home" className="mt-4 inline-flex items-center gap-1 font-bold text-[#c65d3c]">Set your usual window <ChevronRight size={15} /></Link></div></section>
  </div>;
}

function FoodCard({ item, onAdd }: { item: FoodItem; onAdd: () => void }) {
  return <article data-testid={`card-food-${item.id}`} className="group overflow-hidden rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] shadow-warm-sm transition duration-300 hover:-translate-y-1 hover:shadow-warm"><div className="relative"><FoodVisual item={item} className="h-40 transition duration-500 group-hover:scale-[1.03]" />{item.isPopular && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#f6cb63] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6c4d24]"><Flame size={12} fill="currentColor" /> Popular</span>}{!item.isAvailable && <span className="absolute inset-0 grid place-items-center bg-[#173f37]/65 text-sm font-bold text-white">Sold out for now</span>}</div><div className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 data-testid={`text-food-name-${item.id}`} className="font-bold text-[#294b41]">{item.name}</h3><p className="mt-1 line-clamp-1 text-xs text-[#8b735d]">{item.description}</p></div><span data-testid={`text-food-price-${item.id}`} className="font-mono-brand whitespace-nowrap text-sm font-bold text-[#bd5739]">{money(item.price)}</span></div><div className="mt-4 flex items-center justify-between"><span className="flex items-center gap-1 text-xs text-[#92775b]"><Star size={13} className="fill-[#eeb94b] text-[#eeb94b]" /> {item.rating.toFixed(1)} <span className="text-[#b8a591]">({item.ratingCount})</span></span><Button disabled={!item.isAvailable} onClick={onAdd} className="px-3 py-2 text-xs" testId={`button-add-food-${item.id}`}><Plus size={15} /> Add</Button></div></div></article>;
}

function Empty({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-[#d8c7b1] bg-[#fbf3e7] px-6 py-12 text-center" data-testid="empty-state"><div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#f6cb63]/35 text-[#9b632e]"><Soup size={22} /></div><h3 className="font-display text-2xl text-[#294b41]">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-[#8a745e]">{copy}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

function MenuPage({ cart }: { cart: ReturnType<typeof useCart> }) {
  const menu = useGetMenu({ query: { queryKey: getGetMenuQueryKey() } });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const items = menu.data ?? [];
  const categories = ['All', ...Array.from(new Set(items.map((item) => item.category)))];
  const filtered = items.filter((item) => (category === 'All' || item.category === category) && `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase()));
  return <div><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><PageIntro eyebrow="Today’s counter" title="What’s calling?" sub="A short menu, made fresh. Pick a plate and we’ll hold your place in line." /><Link href="/cart" data-testid="link-menu-cart" className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#d9c9b1] bg-[#fffaf0] px-4 py-3 text-sm font-bold text-[#604a36]"><ShoppingBag size={17} /> Tray <span className="grid size-5 place-items-center rounded-full bg-[#f6cb63] text-[10px]">{cart.count}</span></Link></div>
    <div className="mb-7 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9b8066]" /><input value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-menu-search" placeholder="Search dosa, chai, comfort..." className="h-12 w-full rounded-xl border border-[#dcccb8] bg-[#fffaf0] pl-11 pr-4 text-sm outline-none transition placeholder:text-[#b09a82] focus:border-[#e27752] focus:ring-2 focus:ring-[#e27752]/15" /></label><div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} data-testid={`button-category-${item.toLowerCase()}`} className={`whitespace-nowrap rounded-xl px-4 py-3 text-xs font-bold transition ${category === item ? 'bg-[#173f37] text-[#fff8e8]' : 'border border-[#dcccb8] bg-[#fffaf0] text-[#78624e] hover:bg-[#f2e7d8]'}`}>{item}</button>)}</div></div>
    <QueryState isLoading={menu.isLoading} isError={menu.isError} onRetry={() => menu.refetch()} testId="menu" empty={<Empty title="No plates match that" copy="Try a different craving or switch categories." action={<Button variant="outline" onClick={() => { setSearch(''); setCategory('All'); }} testId="button-clear-menu">Clear filters</Button>} />}>{filtered.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <FoodCard key={item.id} item={item} onAdd={() => cart.add(item)} />)}</div> : null}</QueryState>
  </div>;
}

function CartPage({ cart }: { cart: ReturnType<typeof useCart> }) {
  return <div className="mx-auto max-w-[980px]"><PageIntro eyebrow="Your tray" title={cart.count ? 'Ready when you are.' : 'Your tray is quiet.'} sub={cart.count ? 'Check the little things before choosing your pickup window.' : 'Add a plate from today’s menu and it will appear here.'} />{!cart.count ? <Empty title="Nothing on the tray yet" copy="The good news: the menu is only one tap away." action={<Link href="/menu" data-testid="link-empty-cart-menu" className="inline-flex items-center gap-2 rounded-xl bg-[#ea6b42] px-4 py-2.5 text-sm font-bold text-white">Browse menu <ChevronRight size={16} /></Link>} /> : <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]"><div className="space-y-3">{cart.cart.map((item) => <div key={item.id} data-testid={`row-cart-${item.id}`} className="flex gap-3 rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-3 shadow-warm-sm sm:gap-4 sm:p-4"><FoodVisual item={item} className="size-[76px] shrink-0 rounded-xl" /><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div><h3 className="truncate font-bold text-[#294b41]">{item.name}</h3><p className="mt-1 text-xs text-[#8c745c]">{money(item.price)} each</p></div><button onClick={() => cart.remove(item.id)} aria-label={`Remove ${item.name}`} data-testid={`button-remove-cart-${item.id}`} className="text-[#a18a74] transition hover:text-[#bc5338]"><Trash2 size={16} /></button></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2 rounded-lg bg-[#f3e8d9] p-1"><button onClick={() => cart.change(item.id, -1)} aria-label={`Decrease ${item.name}`} data-testid={`button-decrease-cart-${item.id}`} className="grid size-6 place-items-center rounded-md text-[#765b44] hover:bg-[#fffaf0]"><Minus size={13} /></button><span className="w-5 text-center font-mono-brand text-xs font-bold">{item.quantity}</span><button onClick={() => cart.change(item.id, 1)} aria-label={`Increase ${item.name}`} data-testid={`button-increase-cart-${item.id}`} className="grid size-6 place-items-center rounded-md text-[#765b44] hover:bg-[#fffaf0]"><Plus size={13} /></button></div><span className="font-mono-brand text-sm font-bold text-[#bd5739]">{money(item.price * item.quantity)}</span></div></div></div>)}</div><aside className="h-fit rounded-2xl border border-[#173f37] bg-[#173f37] p-5 text-[#fff8e8] shadow-warm"><div className="flex items-center gap-2 text-sm font-bold"><ReceiptText size={17} className="text-[#f6cb63]" /> Order summary</div><div className="mt-5 space-y-3 border-b border-white/15 pb-5 text-sm text-[#c7d8cb]"><div className="flex justify-between"><span>Food total</span><span className="font-mono-brand text-[#fff8e8]">{money(cart.total)}</span></div><div className="flex justify-between"><span>Convenience fee</span><span className="font-mono-brand text-[#fff8e8]">{money(0)}</span></div></div><div className="flex justify-between pt-4"><span className="font-bold">You pay</span><span className="font-mono-brand text-xl font-bold text-[#f6cb63]">{money(cart.total)}</span></div><Link href="/checkout" data-testid="link-go-checkout" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#f6cb63] px-4 py-3 text-sm font-bold text-[#173f37] transition hover:bg-[#ffda7d]">Choose pickup window <ChevronRight size={16} /></Link><button onClick={cart.clear} data-testid="button-clear-cart" className="mt-3 w-full text-xs font-bold text-[#a9c0b1] hover:text-white">Clear tray</button></aside></div>}</div>;
}

function CheckoutPage({ cart }: { cart: ReturnType<typeof useCart> }) {
  const slots = useGetPickupSlots({ query: { queryKey: getGetPickupSlotsQueryKey() } });
  const createOrder = useCreateOrder();
  const [, navigate] = useLocation();
  const [selectedSlot, setSelectedSlot] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('upi');
  const availableSlots = (slots.data ?? []).filter((slot) => slot.isAvailable);
  const submit = () => {
    if (!selectedSlot || !cart.count) return;
    createOrder.mutate({ data: { items: cart.cart.map(({ id, name, price, image, quantity }) => ({ id, name, price, image, quantity })), pickupSlotId: selectedSlot, paymentMethod: payment } }, { onSuccess: (order) => { localStorage.setItem('canteenflow-last-order', JSON.stringify(order)); cart.clear(); navigate('/order-success'); } });
  };
  if (!cart.count) return <Empty title="Your tray needs a plate" copy="Choose something delicious before picking a window." action={<Link href="/menu" data-testid="link-checkout-menu" className="inline-flex items-center gap-2 rounded-xl bg-[#ea6b42] px-4 py-2.5 text-sm font-bold text-white">Back to menu <ChevronRight size={16} /></Link>} />;
  return <div className="mx-auto max-w-[1050px]"><PageIntro eyebrow="Almost there" title="Pick your moment." sub="We’ll have your order bagged and waiting inside this window." /><div className="grid gap-7 lg:grid-cols-[1fr_350px]"><div className="space-y-7"><section><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-2xl text-[#294b41]">01 / Pickup window</h2><span className="text-xs font-bold text-[#9a8068]">Today</span></div><QueryState isLoading={slots.isLoading} isError={slots.isError} onRetry={() => slots.refetch()} testId="pickup-slots" empty={<Empty title="No windows left" copy="The next batch will open soon. Keep your tray ready." />}><div className="grid gap-3 sm:grid-cols-2">{availableSlots.map((slot) => <SlotCard key={slot.id} slot={slot} selected={selectedSlot === slot.id} onSelect={() => setSelectedSlot(slot.id)} />)}</div></QueryState></section><section><h2 className="mb-3 font-display text-2xl text-[#294b41]">02 / How are you paying?</h2><div className="grid gap-3 sm:grid-cols-2"><PaymentCard method="upi" selected={payment === 'upi'} onSelect={() => setPayment('upi')} icon={<CreditCard size={20} />} title="UPI" copy="Pay at the counter with your usual app" /><PaymentCard method="cash" selected={payment === 'cash'} onSelect={() => setPayment('cash')} icon={<WalletCards size={20} />} title="Cash" copy="Keep it exact, keep it moving" /></div></section></div><aside className="h-fit rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 shadow-warm-sm lg:sticky lg:top-[96px]"><h2 className="font-display text-2xl text-[#294b41]">Your order</h2><div className="mt-4 space-y-3">{cart.cart.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span className="text-[#7f6952]">{item.quantity} × {item.name}</span><span className="font-mono-brand text-xs font-bold text-[#604a36]">{money(item.price * item.quantity)}</span></div>)}</div><div className="mt-5 flex justify-between border-t border-[#e6d8c4] pt-4 font-bold text-[#294b41]"><span>Total</span><span className="font-mono-brand text-lg text-[#bd5739]">{money(cart.total)}</span></div><Button className="mt-5 w-full py-3.5" onClick={submit} disabled={!selectedSlot || createOrder.isPending} testId="button-place-order">{createOrder.isPending ? <><RefreshCw className="animate-spin" size={16} /> Placing...</> : <><Check size={17} /> Place order</>}</Button>{createOrder.isError && <p data-testid="error-place-order" className="mt-3 text-center text-xs font-bold text-[#bb5038]">Couldn’t place that. Please try again.</p>}<p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#927a62]"><ShieldCheck size={13} /> Your order is only shared with the canteen.</p></aside></div></div>;
}

function SlotCard({ slot, selected, onSelect }: { slot: PickupSlot; selected: boolean; onSelect: () => void }) {
  const remaining = Math.max(slot.capacity - slot.booked, 0);
  return <button onClick={onSelect} disabled={!slot.isAvailable} data-testid={`button-slot-${slot.id}`} className={`relative rounded-2xl border p-4 text-left transition ${selected ? 'border-[#ea6b42] bg-[#fff0e9] ring-2 ring-[#ea6b42]/15' : 'border-[#e3d7c5] bg-[#fffaf0] hover:-translate-y-0.5 hover:border-[#d1b99c]'} disabled:opacity-50`}><span className={`absolute right-4 top-4 grid size-5 place-items-center rounded-full border ${selected ? 'border-[#ea6b42] bg-[#ea6b42] text-white' : 'border-[#d5c4ac]'}`}>{selected && <Check size={12} />}</span><span className="font-mono-brand text-lg font-bold text-[#294b41]">{timeLabel(slot.startTime)} <span className="font-sans text-xs font-normal text-[#a0876c]">— {timeLabel(slot.endTime)}</span></span><span className={`mt-2 block text-xs font-bold ${remaining < 5 ? 'text-[#bd5739]' : 'text-[#7e9a76]'}`}>{remaining < 5 ? `Only ${remaining} left` : `${remaining} spots available`}</span></button>;
}

function PaymentCard({ method, selected, onSelect, icon, title, copy }: { method: PaymentMethod; selected: boolean; onSelect: () => void; icon: ReactNode; title: string; copy: string }) {
  return <button onClick={onSelect} data-testid={`button-payment-${method}`} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${selected ? 'border-[#173f37] bg-[#eaf2ec] ring-2 ring-[#173f37]/10' : 'border-[#e3d7c5] bg-[#fffaf0] hover:border-[#c9b79f]'}`}><span className={`grid size-10 place-items-center rounded-xl ${selected ? 'bg-[#173f37] text-[#f6cb63]' : 'bg-[#f2e7d8] text-[#81664b]'}`}>{icon}</span><span><span className="block font-bold text-[#294b41]">{title}</span><span className="mt-0.5 block text-xs text-[#89735d]">{copy}</span></span>{selected && <Check size={17} className="ml-auto text-[#26735a]" />}</button>;
}

function SuccessPage() {
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => { try { setOrder(JSON.parse(localStorage.getItem('canteenflow-last-order') ?? 'null') as Order | null); } catch { setOrder(null); } }, []);
  return <div className="mx-auto max-w-[680px] py-6 text-center"><div className="mx-auto grid size-20 place-items-center rounded-[28px] bg-[#f6cb63] text-[#173f37] shadow-warm animate-pop"><Check size={36} strokeWidth={3} /></div><p className="mt-6 font-mono-brand text-[11px] font-bold uppercase tracking-[.18em] text-[#bb6a42]">Order locked in</p><h1 className="mt-2 font-display text-5xl leading-none tracking-[-.04em] text-[#24493f]">That’s the hard part<br /><em>done.</em></h1><p className="mx-auto mt-4 max-w-md text-[15px] leading-6 text-[#7f6b55]">We’ll start your order close to the window, so it is fresh when you arrive — not waiting around getting sad.</p>{order ? <div className="mt-8 overflow-hidden rounded-[26px] border border-[#173f37] bg-[#173f37] p-6 text-left text-[#fff8e8] shadow-warm"><div className="flex items-center justify-between border-b border-white/15 pb-4"><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.13em] text-[#b5cfbe]"><Ticket size={15} className="text-[#f6cb63]" /> Pickup token</span><span className="font-mono-brand text-xs text-[#b5cfbe]">#{order.id.slice(-6).toUpperCase()}</span></div><div className="flex flex-col items-center gap-5 py-7 sm:flex-row sm:justify-between"><div><p className="font-mono-brand text-7xl font-bold tracking-[.06em] text-[#f6cb63]">{order.pickupToken || 'CF-24'}</p><p className="mt-2 text-sm text-[#c4d8cb]">Show this at the counter</p></div><div className="grid size-28 place-items-center rounded-2xl bg-[#fff8e8] text-[#173f37]"><QrCode size={84} strokeWidth={1.5} /></div></div><div className="grid grid-cols-2 gap-3 border-t border-white/15 pt-4"><div><p className="text-[10px] uppercase tracking-widest text-[#9db9aa]">Pickup window</p><p className="mt-1 text-sm font-bold">{timeLabel(order.pickupTime)}</p></div><div><p className="text-[10px] uppercase tracking-widest text-[#9db9aa]">Total</p><p className="mt-1 font-mono-brand text-sm font-bold">{money(order.total)}</p></div></div></div> : <div className="mt-8 rounded-2xl border border-dashed border-[#d8c7b1] bg-[#fbf3e7] p-8 text-sm text-[#856d54]">Your token is safe in Orders. You can open it anytime.</div>}<div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/orders" data-testid="link-view-orders" className="inline-flex items-center gap-2 rounded-xl bg-[#ea6b42] px-5 py-3 text-sm font-bold text-white">Track this order <ChevronRight size={16} /></Link><Link href="/menu" data-testid="link-order-again" className="inline-flex items-center gap-2 rounded-xl border border-[#d9c9b1] bg-[#fffaf0] px-5 py-3 text-sm font-bold text-[#604a36]"><Plus size={16} /> Order something else</Link></div></div>;
}

function OrdersPage() {
  const orders = useGetOrders({ query: { queryKey: getGetOrdersQueryKey() } });
  const sorted = [...(orders.data ?? [])].sort((a, b) => +new Date(b.placedAt) - +new Date(a.placedAt));
  const active = sorted.filter((order) => order.status !== 'completed');
  const past = sorted.filter((order) => order.status === 'completed');
  return <div><PageIntro eyebrow="Your canteen trail" title="Orders, without the hunt." sub="Every token, every plate, one calm place." /><QueryState isLoading={orders.isLoading} isError={orders.isError} onRetry={() => orders.refetch()} testId="orders" empty={<Empty title="No orders yet" copy="Your first shortcut is waiting on the menu." action={<Link href="/menu" data-testid="link-orders-menu" className="inline-flex items-center gap-2 rounded-xl bg-[#ea6b42] px-4 py-2.5 text-sm font-bold text-white">Browse menu <ChevronRight size={16} /></Link>} />}>{<div className="space-y-9">{active.length > 0 && <OrderGroup title="In motion" icon={<Zap size={16} />} orders={active} />}{past.length > 0 && <OrderGroup title="Earlier orders" icon={<History size={16} />} orders={past} />}{!active.length && !past.length && <Empty title="No orders yet" copy="Your first shortcut is waiting on the menu." />}</div>}</QueryState></div>;
}

function OrderGroup({ title, icon, orders }: { title: string; icon: ReactNode; orders: Order[] }) {
  return <section><div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#a36a43]">{icon}{title}</div><div className="grid gap-3">{orders.map((order) => <Link href={`/orders/${order.id}`} key={order.id} data-testid={`card-order-${order.id}`} className="group flex flex-col gap-4 rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-4 shadow-warm-sm transition hover:-translate-y-0.5 hover:shadow-warm sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="flex min-w-0 items-center gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f2e4d0] text-[#a9613f]"><ReceiptText size={20} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono-brand text-xs font-bold text-[#294b41]">#{order.id.slice(-6).toUpperCase()}</span><StatusPill status={order.status} /></div><p className="mt-1 truncate text-sm text-[#846d55]">{order.items.map((item) => `${item.quantity} × ${item.name}`).join(', ')}</p></div></div><div className="flex items-center justify-between gap-6 pl-14 sm:pl-0"><div className="text-right"><p className="font-mono-brand text-sm font-bold text-[#bd5739]">{money(order.total)}</p><p className="mt-1 text-[11px] text-[#a08870]">{dateLabel(order.placedAt)} · {timeLabel(order.pickupTime)}</p></div><ChevronRight size={18} className="text-[#b0977a] transition group-hover:translate-x-1" /></div></Link>)}</div></section>;
}

function TrackingPage() {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const order = useGetOrder(orderId, { query: { queryKey: getGetOrderQueryKey(orderId), enabled: Boolean(orderId) } });
  const statuses = [{ key: 'placed', title: 'Order received', copy: 'The canteen has your request.' }, { key: 'accepted', title: 'Canteen accepted', copy: 'Your plate has a place in the queue.' }, { key: 'preparing', title: 'Being prepared', copy: 'Freshness is happening right now.' }, { key: 'ready', title: 'Ready for pickup', copy: 'Show your token at the handoff counter.' }, { key: 'completed', title: 'Picked up', copy: 'Enjoy every bite.' }];
  const currentIndex = Math.max(statuses.findIndex((item) => item.key === order.data?.status), 0);
  return <div className="mx-auto max-w-[900px]"><Link href="/orders" data-testid="link-back-orders" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#9e613f]"><ChevronRight size={16} className="rotate-180" /> All orders</Link><QueryState isLoading={order.isLoading} isError={order.isError} onRetry={() => order.refetch()} testId="order-detail" empty={<Empty title="That order went missing" copy="Try returning to your order list." />}><>{order.data && <><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><PageIntro eyebrow={`Order #${order.data.id.slice(-6).toUpperCase()}`} title={order.data.status === 'ready' ? 'Your plate is waiting.' : 'Good things in motion.'} sub={`Pickup ${timeLabel(order.data.pickupTime)} · ${dateLabel(order.data.placedAt)}`} /><StatusPill status={order.data.status} /></div><div className="grid gap-6 lg:grid-cols-[1fr_280px]"><section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 shadow-warm-sm sm:p-7"><div className="mb-8 h-2 overflow-hidden rounded-full bg-[#ede1d0]"><div className="h-full rounded-full bg-[#ea6b42] transition-all duration-700" style={{ width: `${((currentIndex + 1) / statuses.length) * 100}%` }} /></div><div className="space-y-7">{statuses.map((item, index) => { const done = index <= currentIndex; return <div key={item.key} className="flex gap-4"><div className={`relative grid size-9 shrink-0 place-items-center rounded-full ${done ? 'bg-[#173f37] text-[#f6cb63]' : 'border border-[#d9c9b1] bg-[#f8efdf] text-[#b29a80]'}`}>{done ? <Check size={16} strokeWidth={3} /> : <span className="size-2 rounded-full bg-current" />}{index < statuses.length - 1 && <span className={`absolute left-1/2 top-9 h-8 w-px -translate-x-1/2 ${index < currentIndex ? 'bg-[#173f37]' : 'bg-[#ddceb9]'}`} />}</div><div><h3 className={`font-bold ${done ? 'text-[#294b41]' : 'text-[#a28d77]'}`}>{item.title}</h3><p className={`mt-1 text-sm ${done ? 'text-[#806a53]' : 'text-[#b09b85]'}`}>{item.copy}</p></div></div>; })}</div></section><aside className="h-fit rounded-2xl bg-[#173f37] p-5 text-[#fff8e8] shadow-warm"><p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#a9c5b4]">Pickup token</p><p className="mt-2 font-mono-brand text-4xl font-bold tracking-wider text-[#f6cb63]">{order.data.pickupToken || 'CF-24'}</p><div className="mt-5 border-t border-white/15 pt-4"><p className="text-[11px] uppercase tracking-widest text-[#a9c5b4]">Order total</p><p className="mt-1 font-mono-brand text-xl font-bold">{money(order.data.total)}</p></div><div className="mt-5 space-y-2 border-t border-white/15 pt-4">{order.data.items.map((item) => <div key={item.id} className="flex justify-between gap-2 text-xs text-[#c6d9cc]"><span>{item.quantity} × {item.name}</span><span>{money(item.price * item.quantity)}</span></div>)}</div></aside></div></>}</></QueryState></div>;
}

function NotificationsPage() {
  const notifications = useGetNotifications({ query: { queryKey: getGetNotificationsQueryKey() } });
  const markRead = useMarkNotificationsRead();
  const list = notifications.data ?? [];
  return <div className="mx-auto max-w-[850px]"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><PageIntro eyebrow="The useful kind" title="Notifications." sub="A quiet inbox for the moments worth knowing about." />{list.some((item) => !item.read) && <Button variant="outline" className="mb-7 w-fit" onClick={() => markRead.mutate()} disabled={markRead.isPending} testId="button-mark-all-read"><Check size={15} /> Mark all read</Button>}</div><QueryState isLoading={notifications.isLoading} isError={notifications.isError} onRetry={() => notifications.refetch()} testId="notifications" empty={<Empty title="All quiet here" copy="We’ll let you know when your order moves or the canteen has news." />}>{<div className="space-y-2">{list.map((notification) => <div key={notification.id} data-testid={`row-notification-${notification.id}`} className={`flex gap-4 rounded-2xl border p-4 transition ${notification.read ? 'border-[#e3d7c5] bg-[#fffaf0]' : 'border-[#edcfbd] bg-[#fff3ea]'}`}><div className={`grid size-10 shrink-0 place-items-center rounded-xl ${notification.type === 'order' ? 'bg-[#f6cb63]/45 text-[#906329]' : 'bg-[#dcece1] text-[#26735a]'}`}>{notification.type === 'order' ? <PackageCheck size={18} /> : <Bell size={18} />}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><h3 className="font-bold text-[#294b41]">{notification.title}</h3>{!notification.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-[#ea6b42]" />}</div><p className="mt-1 text-sm leading-5 text-[#856e57]">{notification.message}</p><p className="mt-2 text-[11px] font-bold text-[#ae9276]">{notification.time}</p></div></div>)}</div>}</QueryState></div>;
}

function ProfilePage() {
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(true);
  return <div className="mx-auto max-w-[900px]"><PageIntro eyebrow="Your corner of the canteen" title="Profile & settings." sub="Make the small things feel like yours." /><div className="grid gap-6 md:grid-cols-[260px_1fr]"><aside className="rounded-2xl bg-[#173f37] p-6 text-[#fff8e8] shadow-warm"><div className="grid size-16 place-items-center rounded-[20px] bg-[#f6cb63] font-display text-3xl text-[#173f37]">AS</div><h2 className="mt-5 font-display text-3xl">Aarav Shah</h2><p className="mt-1 text-sm text-[#b8d0c0]">B-Block · Room 214</p><div className="mt-7 flex items-center gap-2 border-t border-white/15 pt-4 text-xs text-[#c1d6c8]"><ShieldCheck size={15} className="text-[#f6cb63]" /> Student account verified</div></aside><div className="space-y-4"><section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 shadow-warm-sm"><div className="flex items-center gap-2 text-sm font-bold text-[#294b41]"><Settings size={17} className="text-[#c35e3c]" /> Preferences</div><div className="mt-5 divide-y divide-[#ebdfcd]"><SettingRow title="Order updates" copy="Know when your plate is ready" value={notifications} onChange={() => setNotifications(!notifications)} testId="switch-order-updates" /><SettingRow title="Quick reorder" copy="Keep your recent favourites close" value onChange={() => {}} testId="switch-quick-reorder" /></div></section><section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 shadow-warm-sm"><div className="flex items-center gap-2 text-sm font-bold text-[#294b41]"><MapPin size={17} className="text-[#c35e3c]" /> Hostel details</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-[#846c53]">Hostel block<input defaultValue="B-Block" data-testid="input-hostel-block" className="mt-2 h-11 w-full rounded-xl border border-[#ddceb9] bg-[#fdf5e9] px-3 text-sm text-[#294b41] outline-none focus:border-[#e27752]" /></label><label className="text-xs font-bold text-[#846c53]">Room number<input defaultValue="214" data-testid="input-room-number" className="mt-2 h-11 w-full rounded-xl border border-[#ddceb9] bg-[#fdf5e9] px-3 text-sm text-[#294b41] outline-none focus:border-[#e27752]" /></label></div><Button variant={saved ? 'quiet' : 'primary'} className="mt-5" onClick={() => setSaved(true)} testId="button-save-profile">{saved ? <><Check size={15} /> Saved</> : 'Save details'}</Button></section><button data-testid="button-sign-out" className="flex items-center gap-2 px-1 py-2 text-sm font-bold text-[#94745d] hover:text-[#b94e36]"><LogOut size={16} /> Sign out</button></div></div></div>;
}

function SettingRow({ title, copy, value, onChange, testId }: { title: string; copy: string; value: boolean; onChange: () => void; testId: string }) {
  return <div className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-bold text-[#294b41]">{title}</p><p className="mt-1 text-xs text-[#927a63]">{copy}</p></div><button onClick={onChange} data-testid={testId} aria-pressed={value} className={`relative h-6 w-11 rounded-full transition ${value ? 'bg-[#173f37]' : 'bg-[#d8c8b3]'}`}><span className={`absolute top-1 size-4 rounded-full bg-[#fffaf0] transition ${value ? 'left-6' : 'left-1'}`} /></button></div>;
}

function AdminPage() {
  const orders = useGetOrders({ query: { queryKey: getGetOrdersQueryKey() } });
  const menu = useGetMenu({ query: { queryKey: getGetMenuQueryKey() } });
  const orderList = orders.data ?? [];
  const live = orderList.filter((order) => order.status !== 'completed');
  const ready = orderList.filter((order) => order.status === 'ready');
  const revenue = orderList.reduce((sum, order) => sum + order.total, 0);
  return <div><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><PageIntro eyebrow="Operations view" title="Canteen desk." sub="The pulse of today’s counter, at a glance." /><span className="flex items-center gap-2 text-xs font-bold text-[#26735a]"><span className="size-2 rounded-full bg-[#45a875]" /> Counter open · closes 9:30 pm</span></div><QueryState isLoading={orders.isLoading || menu.isLoading} isError={orders.isError || menu.isError} onRetry={() => { orders.refetch(); menu.refetch(); }} testId="admin-data" empty={<Empty title="Desk is waiting" copy="Operations will appear when the first order lands." />}><div className="space-y-7"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{ label: 'Live orders', value: live.length, icon: Timer, color: 'bg-[#ffe3c9] text-[#ae5b35]' }, { label: 'Ready now', value: ready.length, icon: PackageCheck, color: 'bg-[#dceee5] text-[#26735a]' }, { label: 'Today’s plates', value: orderList.length, icon: Soup, color: 'bg-[#f6cb63]/45 text-[#93642c]' }, { label: 'Revenue', value: money(revenue), icon: WalletCards, color: 'bg-[#e3def0] text-[#66527e]' }].map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-4 shadow-warm-sm"><div className="flex items-start justify-between"><span className={`grid size-9 place-items-center rounded-xl ${color}`}><Icon size={18} /></span><MoreHorizontal size={17} className="text-[#b49c82]" /></div><p data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`} className="mt-5 font-display text-3xl text-[#294b41]">{value}</p><p className="mt-1 text-xs font-bold text-[#92775d]">{label}</p></div>)}</div><div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 shadow-warm-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-2xl text-[#294b41]">Orders in motion</h2><p className="mt-1 text-xs text-[#947b62]">Keep the handoff rhythm smooth.</p></div><Link href="/orders" data-testid="link-admin-orders" className="text-xs font-bold text-[#c65d3c]">Open list</Link></div><div className="space-y-2">{live.length ? live.slice(0, 6).map((order) => <div key={order.id} data-testid={`row-admin-order-${order.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-[#f7eee1] px-3 py-3"><div className="flex min-w-0 items-center gap-3"><span className="font-mono-brand text-[11px] font-bold text-[#294b41]">#{order.id.slice(-5).toUpperCase()}</span><span className="truncate text-xs text-[#806a54]">{order.items[0]?.name}{order.items.length > 1 ? ` + ${order.items.length - 1}` : ''}</span></div><StatusPill status={order.status} /></div>) : <p className="rounded-xl bg-[#f7eee1] p-5 text-center text-sm text-[#937a60]">No live orders. Enjoy the brief.</p>}</div></section><section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 shadow-warm-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-2xl text-[#294b41]">Menu pulse</h2><p className="mt-1 text-xs text-[#947b62]">Availability at a glance.</p></div><Soup size={20} className="text-[#c35e3c]" /></div><div className="space-y-3">{(menu.data ?? []).slice(0, 5).map((item) => <div key={item.id} className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2.5"><FoodVisual item={item} className="size-9 shrink-0 rounded-lg" /><span className="truncate text-xs font-bold text-[#52665b]">{item.name}</span></div><span className={`text-[11px] font-bold ${item.isAvailable ? 'text-[#26735a]' : 'text-[#b65b43]'}`}>{item.isAvailable ? 'Available' : 'Paused'}</span></div>)}</div></section></div></div></QueryState></div>;
}

function Router({ cart }: { cart: ReturnType<typeof useCart> }) {
  const notifications = useGetNotifications({ query: { queryKey: getGetNotificationsQueryKey() } });
  const unread = (notifications.data ?? []).filter((item) => !item.read).length;
  return <RoutedErrorBoundary><Switch><Route path="/"><Shell cartCount={cart.count} unreadCount={unread}><Home cart={cart} /></Shell></Route><Route path="/menu"><Shell cartCount={cart.count} unreadCount={unread}><MenuPage cart={cart} /></Shell></Route><Route path="/cart"><Shell cartCount={cart.count} unreadCount={unread}><CartPage cart={cart} /></Shell></Route><Route path="/checkout"><Shell cartCount={cart.count} unreadCount={unread}><CheckoutPage cart={cart} /></Shell></Route><Route path="/order-success"><Shell cartCount={cart.count} unreadCount={unread}><SuccessPage /></Shell></Route><Route path="/orders"><Shell cartCount={cart.count} unreadCount={unread}><OrdersPage /></Shell></Route><Route path="/orders/:orderId"><Shell cartCount={cart.count} unreadCount={unread}><TrackingPage /></Shell></Route><Route path="/notifications"><Shell cartCount={cart.count} unreadCount={unread}><NotificationsPage /></Shell></Route><Route path="/profile"><Shell cartCount={cart.count} unreadCount={unread}><ProfilePage /></Shell></Route><Route path="/admin"><Shell cartCount={cart.count} unreadCount={unread}><AdminPage /></Shell></Route><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const cart = useCart();
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router cart={cart} /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;