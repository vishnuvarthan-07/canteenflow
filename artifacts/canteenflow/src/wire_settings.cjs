const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// ============================
// 1. Add settings param to Home function and update hero
// ============================
const oldHome = `function Home({ cart, foods }: { cart: ReturnType<typeof useCart>; foods: Food[] }) {
  const [, navigate] = useLocation();
  const popular = foods.filter((item) => item.isPopular);
  
  if (foods.length === 0) {
    return <div className="py-12"><Empty title="No food items are currently available" copy="Please check back later when the canteen is restocked." action={<Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>} /></div>;
  }

  return <div className="space-y-12"><section className="relative overflow-hidden rounded-[28px] bg-[#173f37] px-6 py-10 text-[#fff8e8] shadow-warm lg:px-12 lg:py-14"><div className="absolute -right-20 -top-28 size-[330px] rounded-full border-[42px] border-[#f6cb63]/20" /><div className="relative max-w-[670px] animate-rise"><div className="mb-4 inline-flex rounded-full border border-[#f6cb63]/30 bg-[#f6cb63]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#f6cb63]">Straight from the hostel canteen</div><h1 className="font-display text-[clamp(3.4rem,7vw,6.8rem)] leading-[.86]">Skip the queue.<br /><em className="text-[#f6cb63]">Keep the good mood.</em></h1><p className="mt-6 max-w-[480px] text-[16px] leading-7 text-[#d5e3d9]">Your favourite canteen plates, ordered before the bell rings. Pick a window, walk in, walk out.</p><Link href="/menu" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#f6cb63] px-5 py-3 text-sm font-bold text-[#173f37]">Start an order <ChevronRight size={16} /></Link></div></section><section className="grid gap-4 sm:grid-cols-3">{[{ icon: CalendarClock, title: "Choose your window", copy: "Claim a real pickup time, not a vague ETA." }, { icon: Ticket, title: "Get a tiny token", copy: "One code gets your plate moving at the counter." }, { icon: PackageCheck, title: "Track the handoff", copy: "Know when it is cooking, ready, and yours." }].map(({ icon: Icon, title, copy }) => <div key={title} className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 shadow-warm-sm"><div className="mb-5 grid size-10 place-items-center rounded-xl bg-[#f6cb63]/35 text-[#9a622c]"><Icon size={19} /></div><h2 className="font-bold text-[#294b41]">{title}</h2><p className="mt-1.5 text-sm leading-5 text-[#88735d]">{copy}</p></div>)}</section><section><div className="mb-5 flex items-end justify-between"><div><div className="mb-2 text-[11px] font-bold uppercase tracking-[.17em] text-[#bb6a42]">On the counter today</div><h2 className="font-display text-4xl text-[#24493f]">Popular with your hostel</h2></div><Link href="/menu" className="text-sm font-bold text-[#c65d3c]">See full menu <ChevronRight size={16} /></Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{popular.map((item) => <FoodCard key={item.id} item={item} onAdd={() => cart.add(item)} onOrderNow={() => { cart.clear(); cart.add(item); navigate('/checkout'); }} />)}</div></section></div>;
}`;

const newHome = `function Home({ cart, foods, settings }: { cart: ReturnType<typeof useCart>; foods: Food[]; settings?: any }) {
  const [, navigate] = useLocation();
  const popular = foods.filter((item) => item.isPopular);
  const s = settings || {};
  const heroBg = s.hero_image ? { backgroundImage: \`url(\${s.hero_image})\`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};

  if (foods.length === 0) {
    return <div className="py-12"><Empty title="No food items are currently available" copy="Please check back later when the canteen is restocked." action={<Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>} /></div>;
  }

  return <div className="space-y-12">
    <section className="relative overflow-hidden rounded-[28px] bg-[#173f37] px-6 py-10 text-[#fff8e8] shadow-warm lg:px-12 lg:py-14" style={heroBg}>
      {s.hero_image && <div className="absolute inset-0 rounded-[28px] bg-[#173f37]/70" />}
      <div className="absolute -right-20 -top-28 size-[330px] rounded-full border-[42px] border-[#f6cb63]/20" />
      <div className="relative max-w-[670px] animate-rise">
        <div className="mb-4 inline-flex rounded-full border border-[#f6cb63]/30 bg-[#f6cb63]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#f6cb63]">
          {s.hero_badge || 'Straight from the hostel canteen'}
        </div>
        <h1 className="font-display text-[clamp(3.4rem,7vw,6.8rem)] leading-[.86]">
          {s.hero_title || 'Skip the queue.'}<br />
          <em className="text-[#f6cb63]">{s.hero_highlight || 'Keep the good mood.'}</em>
        </h1>
        <p className="mt-6 max-w-[480px] text-[16px] leading-7 text-[#d5e3d9]">
          {s.hero_description || 'Your favourite canteen plates, ordered before the bell rings. Pick a window, walk in, walk out.'}
        </p>
        <Link href={s.hero_button_link || '/menu'} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#f6cb63] px-5 py-3 text-sm font-bold text-[#173f37]">
          {s.hero_button_text || 'Start an order'} <ChevronRight size={16} />
        </Link>
      </div>
    </section>
    <section className="grid gap-4 sm:grid-cols-3">{[{ icon: CalendarClock, title: "Choose your window", copy: "Claim a real pickup time, not a vague ETA." }, { icon: Ticket, title: "Get a tiny token", copy: "One code gets your plate moving at the counter." }, { icon: PackageCheck, title: "Track the handoff", copy: "Know when it is cooking, ready, and yours." }].map(({ icon: Icon, title, copy }) => <div key={title} className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 shadow-warm-sm"><div className="mb-5 grid size-10 place-items-center rounded-xl bg-[#f6cb63]/35 text-[#9a622c]"><Icon size={19} /></div><h2 className="font-bold text-[#294b41]">{title}</h2><p className="mt-1.5 text-sm leading-5 text-[#88735d]">{copy}</p></div>)}</section>
    <section><div className="mb-5 flex items-end justify-between"><div><div className="mb-2 text-[11px] font-bold uppercase tracking-[.17em] text-[#bb6a42]">On the counter today</div><h2 className="font-display text-4xl text-[#24493f]">Popular with your hostel</h2></div><Link href="/menu" className="text-sm font-bold text-[#c65d3c]">See full menu <ChevronRight size={16} /></Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{popular.map((item) => <FoodCard key={item.id} item={item} onAdd={() => cart.add(item)} onOrderNow={() => { cart.clear(); cart.add(item); navigate('/checkout'); }} />)}</div></section>
  </div>;
}`;

code = code.replace(oldHome, newHome);
if (!code.includes("settings?: any }) {\n  const [, navigate] = useLocation();\n  const popular")) {
  console.log('WARNING: Home function replacement may have failed!');
}

// ============================
// 2. Add "Content & Settings" tab to AdminShell nav
// ============================
const oldReqButton = `        <button onClick={() => setActiveTab("requests")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "requests" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
          Registration Requests
        </button>
        <div className="pt-4 mt-4 border-t border-white/10 space-y-1.5">`;

const newReqButton = `        <button onClick={() => setActiveTab("requests")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "requests" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
          Registration Requests
        </button>
        <button onClick={() => setActiveTab("content")} className={\`w-full whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold \${activeTab === "content" ? "bg-white text-[#ea6b42] shadow-sm" : "text-[#7b614b] hover:bg-[#e4d7c6]"}\`}>
          🎨 Content & Settings
        </button>
        <div className="pt-4 mt-4 border-t border-white/10 space-y-1.5">`;

code = code.replace(oldReqButton, newReqButton);

// ============================
// 3. Fix AdminPage to accept settings prop
// ============================
code = code.replace(
  'function AdminPage({ canteenStatus, setSettings }: { canteenStatus?: "OPEN" | "CLOSED"; setSettings?: any; settings?: any }) {',
  'function AdminPage({ canteenStatus, setSettings, settings }: { canteenStatus?: "OPEN" | "CLOSED"; setSettings?: any; settings?: any }) {'
);

// ============================
// 4. Add Content tab panel in AdminPage render
// ============================
const oldEndSection = `      {activeTab === "requests" && (
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
    </AdminShell>`;

const newEndSection = `      {activeTab === "requests" && (
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

      {activeTab === "content" && (
        <section className="animate-rise">
          <AdminSettings currentSettings={settings} onSaved={(updated: any) => { if (setSettings) setSettings((prev: any) => ({ ...prev, ...updated })); }} />
        </section>
      )}
    </AdminShell>`;

code = code.replace(oldEndSection, newEndSection);

// ============================
// 5. Pass settings to Home in Router
// ============================
code = code.replace(
  '<Route path="/"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><Home cart={cart} foods={foods} /></Shell></Route>',
  '<Route path="/"><Shell cartCount={cart.count} unreadCount={notices.filter((n) => !n.is_read).length} canteenStatus={canteenStatus}><Home cart={cart} foods={foods} settings={settings} /></Shell></Route>'
);

// ============================
// 6. Pass settings to AdminPage in Router
// ============================
code = code.replace(
  '<Route path="/admin"><AdminPage canteenStatus={canteenStatus} setSettings={setSettings} /></Route>',
  '<Route path="/admin"><AdminPage canteenStatus={canteenStatus} setSettings={setSettings} settings={settings} /></Route>'
);

fs.writeFileSync('src/App.tsx', code);
console.log('All changes applied!');
