import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Check, ChevronRight, Cake, PartyPopper, CalendarClock, CreditCard, Ticket, Trash2, History, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button, money } from "./App";
import type { Food, UserProfile, EventBooking, CelebrationItem, EventCartLine, EventCakeDetails, CakeConfig } from "./App";

export function formatTime12Hour(timeStr: string) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function EventBookingIntro() {
  return (
    <div className="mx-auto max-w-[1050px]">
      <section className="relative overflow-hidden rounded-[28px] bg-[#294b41] px-6 py-10 text-[#fff8e8] shadow-warm lg:px-12 lg:py-14">
        <div className="relative max-w-[670px] animate-rise">
          <div className="mb-4 inline-flex rounded-full border border-[#f6cb63]/30 bg-[#f6cb63]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#f6cb63]">Advance Bookings Only</div>
          <h1 className="font-display text-[clamp(3.4rem,7vw,6.8rem)] leading-[.86]">Make it<br /><em className="text-[#f6cb63]">memorable.</em></h1>
          <p className="mt-6 max-w-[480px] text-[16px] leading-7 text-[#d5e3d9]">Book bulk catering, custom cakes, and celebration items for your next big college event.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/events/book" className="inline-flex items-center gap-2 rounded-xl bg-[#f6cb63] px-5 py-3 text-sm font-bold text-[#173f37]">Start booking <ChevronRight size={16} /></Link>
            <Link href="/events/my-bookings" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-[#f6cb63] hover:bg-white/20"><History size={16} /> My Bookings</Link>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { icon: CalendarClock, title: "Book in Advance", copy: "Events require at least 1 day advance notice." },
          { icon: Cake, title: "Custom Cakes", copy: "Choose flavour, weight, and a custom message." },
          { icon: PartyPopper, title: "Bulk Quantities", copy: "Order 100+ items without standard stock limits." }
        ].map(({ icon: Icon, title, copy }) => (
          <div key={title} className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 shadow-warm-sm">
            <div className="mb-5 grid size-10 place-items-center rounded-xl bg-[#f6cb63]/35 text-[#9a622c]"><Icon size={19} /></div>
            <h2 className="font-bold text-[#294b41]">{title}</h2>
            <p className="mt-1.5 text-sm leading-5 text-[#88735d]">{copy}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export function EventBookingWizard({ eventCart, foods }: { eventCart: any; foods: Food[] }) {
  const minDate = useMemo(() => {
    // Generate tomorrow's date strictly as YYYY-MM-DD
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  }, []);

  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [celebrationItems, setCelebrationItems] = useState<CelebrationItem[]>([]);
  const [cakeConfigs, setCakeConfigs] = useState<CakeConfig[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number | "">>({});
  const getQty = (id: string) => quantities[id] ?? "";

  // Form State
  const [eventType, setEventType] = useState("Birthday Celebration");
  const [eventName, setEventName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [venue, setVenue] = useState("");
  const [participants, setParticipants] = useState("20");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Cake State
  const [cakeRequired, setCakeRequired] = useState(false);
  const [celebrationFor, setCelebrationFor] = useState("");
  const [cakeFlavour, setCakeFlavour] = useState("Chocolate");
  const [cakeWeight, setCakeWeight] = useState("1 KG");
  const [cakeShape, setCakeShape] = useState("Round");
  const [cakeMessage, setCakeMessage] = useState("");

  useEffect(() => {
    supabase.from("celebration_items").select("*").eq("is_available", true)
      .then(({ data }) => { if (data) setCelebrationItems(data as CelebrationItem[]); });
    supabase.from("cake_configs").select("*").eq("is_active", true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCakeConfigs(data as CakeConfig[]);
          // Set initial defaults based on loaded data
          const flavours = [...new Set(data.map(c => c.flavour))];
          if (flavours.length > 0) setCakeFlavour(flavours[0]);
          const weights = [...new Set(data.filter(c => c.flavour === flavours[0]).map(c => c.weight))];
          if (weights.length > 0) setCakeWeight(weights[0]);
        }
      });
  }, []);

  const selectedCakeConfig = useMemo(() => {
    return cakeConfigs.find(c => c.flavour === cakeFlavour && c.weight === cakeWeight);
  }, [cakeConfigs, cakeFlavour, cakeWeight]);

  const activeCakePrice = selectedCakeConfig ? selectedCakeConfig.price : 0;
  const grandTotalEstimate = eventCart.total + (cakeRequired ? activeCakePrice : 0);

  const nextStep = () => {
    if (step === 1) {
      if (!eventName || !studentName || !contactNumber || !eventDate || !eventTime || !venue) return alert("Please fill all required fields");
      if (!/^\d{10}$/.test(contactNumber)) return alert("Contact number must be exactly 10 digits");
      if (eventDate < minDate) return alert("Advance booking requires at least 1 day notice.");
    }
    setStep(s => s + 1);
  };

  const submitBooking = async () => {
    setLoading(true);
    const cakeDetails = cakeRequired ? {
      celebration_for: celebrationFor, cake_flavour: cakeFlavour, cake_weight: cakeWeight,
      cake_shape: cakeShape, cake_message: cakeMessage, unit_price: activeCakePrice, total_price: activeCakePrice
    } : null;

    const { data: bookingId, error } = await supabase.rpc("place_event_booking", {
      p_event_type: eventType, p_event_name: eventName, p_student_name: studentName,
      p_student_id: studentId, p_contact_number: contactNumber, p_department: department,
      p_event_date: eventDate, p_event_time: eventTime, p_venue: venue,
      p_expected_participants: parseInt(participants) || 0, p_special_instructions: specialInstructions,
      p_items: eventCart.cart.map((i: any) => ({ id: i.id, name: i.name, type: i.type, quantity: i.quantity, price: i.price })),
      p_cake_details: cakeDetails,
      p_estimated_total: grandTotalEstimate
    });

    setLoading(false);
    if (error) {
      console.error(error);
      alert("Error: " + error.message);
    } else if (bookingId) {
      eventCart.clear();
      navigate(`/events/my-bookings`);
    }
  };

  return (
    <div className="mx-auto max-w-[1050px]">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl text-[#294b41]">Event Booking</h1>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className={`h-2 w-10 rounded-full ${step >= s ? "bg-[#ea6b42]" : "bg-[#e3d7c5]"}`} />
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          {step === 1 && (
            <section className="animate-rise rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-6 shadow-warm-sm">
              <h2 className="mb-5 font-display text-2xl text-[#294b41]">Step 1: Event Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col text-xs font-bold text-[#294b41]">Event Type
                  <select value={eventType} onChange={e => setEventType(e.target.value)} className="mt-2 h-12 rounded-xl border border-[#dcccb8] bg-white px-4 text-sm">
                    <option>Birthday Celebration</option><option>Cultural Event</option><option>Department Event</option><option>Farewell Party</option>
                  </select>
                </label>
                <label className="flex flex-col text-xs font-bold text-[#294b41]">Event Name
                  <input required value={eventName} onChange={e => setEventName(e.target.value)} className="mt-2 h-12 rounded-xl border border-[#dcccb8] bg-white px-4 text-sm" placeholder="e.g. CS Dept Farewell" />
                </label>
                <label className="flex flex-col text-xs font-bold text-[#294b41]">Organizer Name
                  <input required value={studentName} onChange={e => setStudentName(e.target.value)} className="mt-2 h-12 rounded-xl border border-[#dcccb8] bg-white px-4 text-sm" />
                </label>
                <label className="flex flex-col text-xs font-bold text-[#294b41]">Contact Number
                  <input required value={contactNumber} onChange={e => setContactNumber(e.target.value)} className="mt-2 h-12 rounded-xl border border-[#dcccb8] bg-white px-4 text-sm" />
                </label>
                <label className="flex flex-col text-xs font-bold text-[#294b41]">Event Date
                  <input required type="date" min={minDate} value={eventDate} onChange={e => setEventDate(e.target.value)} className="mt-2 h-12 rounded-xl border border-[#dcccb8] bg-white px-4 text-sm" />
                </label>
                <label className="flex flex-col text-xs font-bold text-[#294b41]">Event Time
                  <input required type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className="mt-2 h-12 rounded-xl border border-[#dcccb8] bg-white px-4 text-sm" />
                </label>
                <label className="flex flex-col text-xs font-bold text-[#294b41] sm:col-span-2">Venue
                  <input required value={venue} onChange={e => setVenue(e.target.value)} className="mt-2 h-12 rounded-xl border border-[#dcccb8] bg-white px-4 text-sm" placeholder="e.g. Main Auditorium" />
                </label>
              </div>
              <Button className="mt-6 w-full" onClick={nextStep}>Next Step</Button>
            </section>
          )}

          {step === 2 && (
            <section className="animate-rise rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-6 shadow-warm-sm">
              <h2 className="mb-5 font-display text-2xl text-[#294b41]">Step 2: Custom Cake (Optional)</h2>
              <label className="mb-6 flex items-center gap-3 font-bold text-[#294b41]">
                <input type="checkbox" checked={cakeRequired} onChange={e => setCakeRequired(e.target.checked)} className="size-5" /> Include Custom Cake
              </label>
              {cakeRequired && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col text-xs font-bold text-[#294b41]">Celebration For (Name)
                    <input required value={celebrationFor} onChange={e => setCelebrationFor(e.target.value)} className="mt-2 h-12 rounded-xl border border-[#dcccb8] bg-white px-4 text-sm" />
                  </label>
                  <label className="flex flex-col text-xs font-bold text-[#294b41]">Flavour
                    <select value={cakeFlavour} onChange={e => {
                        setCakeFlavour(e.target.value);
                        // Auto-select first available weight for this flavour
                        const weights = cakeConfigs.filter(c => c.flavour === e.target.value).map(c => c.weight);
                        if (weights.length > 0 && !weights.includes(cakeWeight)) {
                            setCakeWeight(weights[0]);
                        }
                    }} className="mt-2 h-12 rounded-xl border border-[#dcccb8] bg-white px-4 text-sm">
                      {[...new Set(cakeConfigs.map(c => c.flavour))].map(f => (
                          <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col text-xs font-bold text-[#294b41]">Weight
                    <select value={cakeWeight} onChange={e => setCakeWeight(e.target.value)} className="mt-2 h-12 rounded-xl border border-[#dcccb8] bg-white px-4 text-sm">
                      {cakeConfigs.filter(c => c.flavour === cakeFlavour).map(c => (
                          <option key={c.weight} value={c.weight}>{c.weight} - {money(c.price)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col text-xs font-bold text-[#294b41] sm:col-span-2">Cake Message
                    <input required value={cakeMessage} onChange={e => setCakeMessage(e.target.value)} className="mt-2 h-12 rounded-xl border border-[#dcccb8] bg-white px-4 text-sm" placeholder="Happy Birthday!" />
                  </label>
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={nextStep}>Next Step</Button>
              </div>
            </section>
          )}



          {step === 3 && (
            <section className="animate-rise rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-6 shadow-warm-sm">
              <h2 className="mb-5 font-display text-2xl text-[#294b41]">Step 3: Celebration Items</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {celebrationItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-[#dcccb8] bg-white p-3">
                    <div><div className="font-bold text-[#294b41]">{item.name}</div><div className="text-xs text-[#bd5739]">{money(item.price)}</div></div>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" placeholder="Qty" className="w-16 h-8 rounded border border-[#dcccb8] bg-white px-2 text-sm text-center" value={getQty(item.id)} onChange={e => setQuantities({...quantities, [item.id]: e.target.value === "" ? "" : parseInt(e.target.value)})} />
                      <Button variant="outline" className="px-3 h-8 py-1 text-xs" onClick={() => { const q = quantities[item.id]; if (typeof q === "number" && q > 0) eventCart.add({ id: item.id, name: item.name, price: item.price, type: "CELEBRATION" }, q); }}>Add</Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1" onClick={nextStep}>Next Step</Button>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="animate-rise rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-6 shadow-warm-sm">
              <h2 className="mb-5 font-display text-2xl text-[#294b41]">Step 4: Bulk Food Order</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {foods.filter(f => f.isAvailable).map(food => (
                  <div key={food.id} className="flex items-center justify-between rounded-xl border border-[#dcccb8] bg-white p-3">
                    <div className="flex items-center gap-3">
                      <img src={food.image} className="size-10 rounded object-cover" />
                      <div><div className="font-bold text-sm text-[#294b41] line-clamp-1">{food.name}</div><div className="text-xs text-[#bd5739]">{money(food.price)}</div></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" placeholder="Qty" className="w-16 h-8 rounded border border-[#dcccb8] bg-white px-2 text-sm text-center" value={getQty(food.id)} onChange={e => setQuantities({...quantities, [food.id]: e.target.value === "" ? "" : parseInt(e.target.value)})} />
                      <Button variant="outline" className="px-3 h-8 py-1 text-xs" onClick={() => { const q = quantities[food.id]; if (typeof q === "number" && q > 0) eventCart.add({ id: food.id, name: food.name, price: food.price, type: "FOOD" }, q); }}>Add</Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button className="flex-1" onClick={nextStep}>Review Booking</Button>
              </div>
            </section>
          )}

          {step === 5 && (
            <section className="animate-rise rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-6 shadow-warm-sm">
              <h2 className="mb-5 font-display text-2xl text-[#294b41]">Step 5: Review & Submit</h2>
              <div className="space-y-4 text-sm text-[#5d4a38]">
                <div className="flex justify-between border-b border-[#e3d7c5] pb-2"><b>Event:</b> {eventName} ({eventType})</div>
                <div className="flex justify-between border-b border-[#e3d7c5] pb-2"><b>Date & Time:</b> {eventDate} {formatTime12Hour(eventTime)}</div>
                <div className="flex justify-between border-b border-[#e3d7c5] pb-2"><b>Venue:</b> {venue} ({participants} people)</div>
                {cakeRequired && <div className="flex flex-col border-b border-[#e3d7c5] pb-2 space-y-2 mt-2">
                    <div className="font-bold text-[#294b41] text-lg">Cake Details</div>
                    <div className="flex justify-between text-sm text-[#5d4a38]"><b>Custom Cake:</b> <span>Yes</span></div>
                    <div className="flex justify-between text-sm text-[#5d4a38]"><b>Celebration For:</b> <span>{celebrationFor}</span></div>
                    <div className="flex justify-between text-sm text-[#5d4a38]"><b>Flavour:</b> <span>{cakeFlavour}</span></div>
                    <div className="flex justify-between text-sm text-[#5d4a38]"><b>Weight:</b> <span>{cakeWeight}</span></div>
                    <div className="flex justify-between text-sm text-[#5d4a38]"><b>Cake Price:</b> <span>{money(activeCakePrice)}</span></div>
                    <div className="flex justify-between text-sm text-[#5d4a38]"><b>Cake Message:</b> <span>{cakeMessage}</span></div>
                </div>}
                
                {eventCart.cart.length > 0 && (
                  <div className="border-b border-[#e3d7c5] pb-2">
                    <b>Items & Food:</b>
                    <ul className="mt-2 space-y-1">
                      {eventCart.cart.map((item: any) => (
                        <li key={item.id} className="flex justify-between text-xs text-[#88735d]">
                          <span>{item.quantity} × {item.name}</span>
                          <span>{money(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex justify-between pt-2 text-lg font-bold text-[#294b41]"><b>Grand Total:</b> {money(grandTotalEstimate)}</div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStep(4)}>Back</Button>
                <Button className="flex-1" onClick={submitBooking} disabled={loading}>{loading ? "Submitting..." : "Submit Pending Request"}</Button>
              </div>
            </section>
          )}
        </div>

        <aside className="h-fit rounded-2xl bg-[#173f37] p-5 text-white lg:sticky lg:top-[96px]">
          <h2 className="font-display text-2xl">Event Cart</h2>
          {eventCart.cart.length === 0 ? <div className="mt-4 text-sm text-[#a9c0b1]">Cart is empty</div> : (
            <div className="mt-4 space-y-4 max-h-[400px] overflow-auto pr-2">
              {eventCart.cart.map((item: any) => (
                <div key={item.id} className="text-sm">
                  <div className="flex justify-between text-[#fff8e8]"><span>{item.name}</span><span>{money(item.price * item.quantity)}</span></div>
                  <div className="mt-1 flex items-center gap-2 text-[#a9c0b1]">
                    <button onClick={() => eventCart.change(item.id, -1)} className="size-5 rounded-full border border-[#a9c0b1]">-1</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => eventCart.change(item.id, 1)} className="size-5 rounded-full border border-[#a9c0b1]">+1</button>
                    <button onClick={() => eventCart.remove(item.id)} className="ml-auto text-red-400"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {cakeRequired && (
            <div className="mt-4 border-t border-white/15 pt-4 text-sm">
              <div className="font-bold text-[#fff8e8]">Custom Cake</div>
              <div className="mt-1 flex justify-between text-[#a9c0b1]"><span>{cakeWeight} {cakeFlavour}</span><span>{money(activeCakePrice)}</span></div>
            </div>
          )}
          <div className="mt-5 flex justify-between border-t border-white/15 pt-4 font-bold"><span>Total Estimate</span><span className="text-[#f6cb63]">{money(grandTotalEstimate)}</span></div>
        </aside>
      </div>
    </div>
  );
}

export function AdminEventBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = () => {
    supabase.from("event_bookings").select(`
      *,
      event_booking_items (*),
      event_cake_details (*)
    `).order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setBookings(data);
        setLoading(false);
      });
  };

  const [filter, setFilter] = useState("all");
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const deleteSelectedBookings = async () => {
    if (selectedBookingIds.length === 0) return;
    if (!confirm(`Are you sure you want to completely delete ${selectedBookingIds.length} event booking(s)? This action cannot be undone.`)) return;
    setDeleting(true);
    const { error } = await supabase.from("event_bookings").delete().in("id", selectedBookingIds);
    if (error) {
      alert("Error deleting event bookings: " + error.message);
    } else {
      setSelectedBookingIds([]);
      fetchBookings();
    }
    setDeleting(false);
  };

  useEffect(() => { 
    fetchBookings(); 

    const channel = supabase
      .channel('admin-event-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_bookings' },
        () => {
          fetchBookings();
        }
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);
  const updateStatus = async (id: string, status: string, reason?: string) => {
    await supabase.from("event_bookings").update({ status, rejection_reason: reason || null }).eq("id", id);
    fetchBookings();
  };

  if (loading) return <div className="p-8 text-center text-[#8a745e]">Loading event bookings...</div>;

  const filteredBookings = bookings.filter(b => {
    if (filter === "all") return true;
    if (filter === "accepted") return ['ACCEPTED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'].includes(b.status);
    if (filter === "cancelled") return b.status === "CANCELLED" || b.status === "REJECTED";
    return true;
  });

  const allFilteredBookingIds = filteredBookings.map((b: any) => b.id);
  const isAllSelected = allFilteredBookingIds.length > 0 && selectedBookingIds.length === allFilteredBookingIds.length;

  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedBookingIds([]);
    else setSelectedBookingIds(allFilteredBookingIds);
  };

  const toggleSelectBooking = (id: string) => {
    setSelectedBookingIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {["all", "accepted", "cancelled"].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)} 
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold capitalize transition ${filter === f ? "border-[#173f37] bg-[#173f37] text-white" : "border-[#e3d7c5] bg-transparent text-[#846d55] hover:border-[#bd5739]"}`}
          >
            {f}
          </button>
        ))}
        {filteredBookings.length > 0 && (
          <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-[#294b41] ml-2 bg-[#fffaf0] px-3 py-1.5 rounded-xl border border-[#e3d7c5]">
            <input type="checkbox" className="size-4" checked={isAllSelected} onChange={toggleSelectAll} />
            Select All
          </label>
        )}
        {selectedBookingIds.length > 0 && (
          <button onClick={deleteSelectedBookings} disabled={deleting} className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-200 transition ml-auto">
            {deleting ? "Deleting..." : `Delete Selected (${selectedBookingIds.length})`}
          </button>
        )}
      </div>
      {filteredBookings.length === 0 ? (
        <div className="p-8 text-center text-[#8a745e]">No event bookings match the filter.</div>
      ) : filteredBookings.map((b: any) => (
        <div key={b.id} className={`relative rounded-2xl border ${selectedBookingIds.includes(b.id) ? 'border-[#ea6b42] bg-[#fffaf0]' : 'border-[#e3d7c5] bg-[#fffaf0]'} p-5 transition-colors`}>
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10">
            <input type="checkbox" className="size-5 cursor-pointer accent-[#ea6b42]" checked={selectedBookingIds.includes(b.id)} onChange={() => toggleSelectBooking(b.id)} />
          </div>
          <div className="mb-4">
             <div className="font-bold text-lg text-[#173f37] mb-2 flex items-center gap-2"><Calendar size={20} className="text-[#ea6b42]" /> {new Date(b.event_date).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}</div>
             <div className="flex flex-col gap-1 mb-4">
               <span className="font-mono-brand text-xl font-bold text-[#ea6b42]">#{b.event_token || 'event:--'}</span>
               <span className="text-sm font-bold text-[#a08870]">Session: {formatTime12Hour(b.event_time)}</span>
             </div>
          </div>
          <div className="mb-4 flex items-start justify-between border-b border-[#e3d7c5] pb-4 pr-8">
            <div>
              <div className="text-xl font-bold text-[#294b41]">{b.event_name}</div>
              <div className="text-sm font-bold text-[#ea6b42]">{b.event_type} | {b.event_date} @ {formatTime12Hour(b.event_time)}</div>
              <div className="mt-1 text-xs text-[#88735d]">By: {b.student_name} ({b.contact_number})</div>
            </div>
            <div className="flex gap-2">
              <select 
                value={['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'].includes(b.status) ? 'ACCEPTED' : b.status === 'REJECTED' ? 'CANCELLED' : b.status} 
                onChange={(e) => {
                  if (e.target.value === 'CANCELLED') {
                    const reason = prompt("Enter cancellation reason (optional):");
                    updateStatus(b.id, e.target.value, reason || undefined);
                  } else {
                    updateStatus(b.id, e.target.value);
                  }
                }}
                className="rounded-xl border border-[#dcccb8] bg-white p-2 text-sm font-bold text-[#294b41] outline-none"
              >
                <option value="PENDING">PENDING</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h4 className="font-bold text-[#294b41]">Event Details</h4>
              <div className="mt-2 space-y-4 text-sm text-[#5d4a38]">
                <div><div className="font-bold text-[#294b41]">Organizer:</div><div>{b.student_name}</div></div>
                <div><div className="font-bold text-[#294b41]">Contact:</div><div>{b.contact_number}</div></div>
                <div><div className="font-bold text-[#294b41]">Venue:</div><div>{b.venue}</div></div>
                <div><div className="font-bold text-[#294b41]">Participants:</div><div>{b.expected_participants}</div></div>
                <div><div className="font-bold text-[#294b41]">Date:</div><div>{b.event_date}</div></div>
                <div><div className="font-bold text-[#294b41]">Time:</div><div>{formatTime12Hour(b.event_time)}</div></div>
              </div>

              <div className="mt-6">
                <h4 className="font-bold text-[#294b41]">Cake Details</h4>
                <div className="mt-2 space-y-4 text-sm text-[#5d4a38]">
                  {b.event_cake_details ? (
                    <div className="space-y-4">
                      <div><div className="font-bold text-[#294b41]">Custom Cake:</div><div>Included</div></div>
                      <div><div className="font-bold text-[#294b41]">Celebration For:</div><div>{b.event_cake_details.celebration_for}</div></div>
                      <div><div className="font-bold text-[#294b41]">Flavour:</div><div>{b.event_cake_details.cake_flavour}</div></div>
                      <div><div className="font-bold text-[#294b41]">Weight:</div><div>{b.event_cake_details.cake_weight}</div></div>
                      {b.event_cake_details.total_price && <div><div className="font-bold text-[#294b41]">Cake Price:</div><div>{money(b.event_cake_details.total_price)}</div></div>}
                      <div><div className="font-bold text-[#294b41]">Cake Message:</div><div>{b.event_cake_details.cake_message}</div></div>
                    </div>
                  ) : (
                    <div><div className="font-bold text-[#294b41]">Custom Cake:</div><div>Not Included</div></div>
                  )}
                </div>
              </div>
            </div>

            <div>
              {(() => {
                const celebrationItems = b.event_booking_items.filter((i: any) => i.item_type === 'CELEBRATION');
                const foodItems = b.event_booking_items.filter((i: any) => i.item_type === 'FOOD');
                
                return (
                  <div className="space-y-6">
                    {celebrationItems.length > 0 && (
                      <div>
                        <h4 className="font-bold text-[#294b41]">Celebration Items</h4>
                        <ul className="mt-2 space-y-2 text-sm text-[#5d4a38]">
                          {celebrationItems.map((i: any) => (
                            <li key={i.id} className="flex justify-between border-b border-[#e3d7c5] pb-1">
                              <span>{i.quantity} × {i.item_name} <span className="text-xs text-[#88735d]">(@ {money(i.price)})</span></span>
                              <span>{money(i.subtotal)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {foodItems.length > 0 && (
                      <div>
                        <h4 className="font-bold text-[#294b41]">Food Order</h4>
                        <ul className="mt-2 space-y-2 text-sm text-[#5d4a38]">
                          {foodItems.map((i: any) => (
                            <li key={i.id} className="flex justify-between border-b border-[#e3d7c5] pb-1">
                              <span>{i.quantity} × {i.item_name} <span className="text-xs text-[#88735d]">(@ {money(i.price)})</span></span>
                              <span>{money(i.subtotal)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="rounded-xl bg-[#294b41] p-4 text-white">
                      <h4 className="font-bold text-[#f6cb63]">Pricing Summary</h4>
                      <div className="mt-2 space-y-1 text-sm text-[#a9c0b1]">
                         {celebrationItems.length > 0 && <div className="flex justify-between"><span>Celebration Total</span><span>{money(celebrationItems.reduce((acc: number, curr: any) => acc + Number(curr.subtotal), 0))}</span></div>}
                         {foodItems.length > 0 && <div className="flex justify-between"><span>Food Total</span><span>{money(foodItems.reduce((acc: number, curr: any) => acc + Number(curr.subtotal), 0))}</span></div>}
                         {b.event_cake_details && b.event_cake_details.total_price && <div className="flex justify-between"><span>Cake Total</span><span>{money(b.event_cake_details.total_price)}</span></div>}
                      </div>
                      <div className="mt-3 flex justify-between border-t border-white/20 pt-2 font-bold text-lg text-white">
                        <span>Grand Total</span>
                        <span>{money(b.estimated_total)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminCelebrationItems() {
  const [items, setItems] = useState<CelebrationItem[]>([]);
  const fetchItems = () => supabase.from("celebration_items").select("*").order("created_at").then(({ data }) => setItems(data as CelebrationItem[] || []));
  
  useEffect(() => { fetchItems(); }, []);

  const createItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await supabase.from("celebration_items").insert({ name: f.get("name"), price: parseFloat(f.get("price") as string) });
    fetchItems();
    (e.target as HTMLFormElement).reset();
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    await supabase.from("celebration_items").update({ is_available: !current }).eq("id", id);
    fetchItems();
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const startEdit = (item: CelebrationItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(item.price.toString());
  };

  const saveEdit = async (id: string) => {
    await supabase.from("celebration_items").update({ name: editName, price: parseFloat(editPrice) }).eq("id", id);
    setEditingId(null);
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    if (confirm("Are you sure? It's recommended to just mark it as 'Hidden' if it was used in past bookings.")) {
      const { error } = await supabase.from("celebration_items").delete().eq("id", id);
      if (error) {
        alert("Cannot delete item because it is referenced in past bookings. Marking as Hidden instead.");
        await supabase.from("celebration_items").update({ is_available: false }).eq("id", id);
      }
      fetchItems();
    }
  };

  return (
    <div>
      <form onSubmit={createItem} className="mb-6 flex gap-3 rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5">
        <label className="flex-1 flex flex-col text-xs font-bold text-[#294b41]">Item Name
          <input required name="name" className="mt-1 h-10 rounded-xl border border-[#dcccb8] px-3 text-sm" placeholder="Birthday Cap" />
        </label>
        <label className="flex-1 flex flex-col text-xs font-bold text-[#294b41]">Price
          <input required name="price" type="number" step="0.01" className="mt-1 h-10 rounded-xl border border-[#dcccb8] px-3 text-sm" placeholder="10" />
        </label>
        <Button type="submit" className="mt-auto h-10">Add Item</Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-[#e3d7c5] bg-white p-4">
            {editingId === item.id ? (
              <div className="flex-1 flex gap-2 mr-4">
                <input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 flex-1 rounded border px-2 text-sm" />
                <input value={editPrice} type="number" step="0.01" onChange={e => setEditPrice(e.target.value)} className="h-8 w-20 rounded border px-2 text-sm" />
                <Button onClick={() => saveEdit(item.id)} className="h-8 px-3 text-xs">Save</Button>
                <Button variant="outline" onClick={() => setEditingId(null)} className="h-8 px-3 text-xs">Cancel</Button>
              </div>
            ) : (
              <div>
                <div className="font-bold text-[#294b41]">{item.name}</div>
                <div className="text-sm font-bold text-[#bd5739]">{money(item.price)}</div>
              </div>
            )}
            
            {editingId !== item.id && (
              <div className="flex gap-2">
                <button onClick={() => startEdit(item)} className="rounded bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700">Edit</button>
                <button onClick={() => toggleAvailability(item.id, item.is_available)} className={`rounded px-3 py-1.5 text-xs font-bold ${item.is_available ? 'bg-[#dceee5] text-[#26735a]' : 'bg-[#e3d7c5] text-[#846d55]'}`}>
                  {item.is_available ? "Available" : "Hidden"}
                </button>
                <button onClick={() => deleteItem(item.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={16}/>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminCakeConfigs() {
  const [configs, setConfigs] = useState<CakeConfig[]>([]);
  const fetchConfigs = () => supabase.from("cake_configs").select("*").order("flavour").order("weight").then(({ data, error }) => {
    if (error) console.error("Error fetching cake configs:", error);
    setConfigs(data as CakeConfig[] || []);
  });
  
  useEffect(() => { fetchConfigs(); }, []);

  const createConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const { error } = await supabase.from("cake_configs").insert({ 
      flavour: f.get("flavour"), 
      weight: f.get("weight"),
      price: parseFloat(f.get("price") as string) 
    });
    if (error) {
      alert("Error adding cake config: " + error.message);
    } else {
      fetchConfigs();
      (e.target as HTMLFormElement).reset();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("cake_configs").update({ is_active: !current }).eq("id", id);
    if (error) alert("Error: " + error.message);
    fetchConfigs();
  };

  const deleteConfig = async (id: string) => {
    if (confirm("Are you sure you want to delete this configuration?")) {
      const { error } = await supabase.from("cake_configs").delete().eq("id", id);
      if (error) {
        alert("Cannot delete this configuration because it might be referenced. Try disabling it instead.");
      } else {
        fetchConfigs();
      }
    }
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  const startEdit = (config: CakeConfig) => {
    setEditingId(config.id);
    setEditPrice(config.price.toString());
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from("cake_configs").update({ price: parseFloat(editPrice) }).eq("id", id);
    if (error) alert("Error saving edit: " + error.message);
    else setEditingId(null);
    fetchConfigs();
  };

  return (
    <div>
      <form onSubmit={createConfig} className="mb-6 flex gap-3 rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5">
        <label className="flex-1 flex flex-col text-xs font-bold text-[#294b41]">Flavour
          <input required name="flavour" className="mt-1 h-10 rounded-xl border border-[#dcccb8] px-3 text-sm" placeholder="e.g. Chocolate" />
        </label>
        <label className="flex-1 flex flex-col text-xs font-bold text-[#294b41]">Weight
          <input required name="weight" className="mt-1 h-10 rounded-xl border border-[#dcccb8] px-3 text-sm" placeholder="e.g. 1 KG" />
        </label>
        <label className="flex-1 flex flex-col text-xs font-bold text-[#294b41]">Price
          <input required name="price" type="number" step="0.01" className="mt-1 h-10 rounded-xl border border-[#dcccb8] px-3 text-sm" placeholder="750" />
        </label>
        <Button type="submit" className="mt-auto h-10">Add Option</Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {configs.map(config => (
          <div key={config.id} className="flex items-center justify-between rounded-xl border border-[#e3d7c5] bg-white p-4">
            <div>
              <div className="font-bold text-[#294b41]">{config.flavour} ({config.weight})</div>
              {editingId === config.id ? (
                <div className="mt-1 flex gap-2">
                  <input value={editPrice} type="number" step="0.01" onChange={e => setEditPrice(e.target.value)} className="h-8 w-20 rounded border px-2 text-sm" />
                  <Button onClick={() => saveEdit(config.id)} className="h-8 px-3 text-xs">Save</Button>
                  <Button variant="outline" onClick={() => setEditingId(null)} className="h-8 px-3 text-xs">Cancel</Button>
                </div>
              ) : (
                <div className="text-sm font-bold text-[#bd5739]">{money(config.price)}</div>
              )}
            </div>
            
            {editingId !== config.id && (
              <div className="flex gap-2">
                <button onClick={() => startEdit(config)} className="rounded bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700">Edit Price</button>
                <button onClick={() => toggleActive(config.id, config.is_active)} className={`rounded px-3 py-1.5 text-xs font-bold ${config.is_active ? 'bg-[#dceee5] text-[#26735a]' : 'bg-[#e3d7c5] text-[#846d55]'}`}>
                  {config.is_active ? "Active" : "Disabled"}
                </button>
                <button onClick={() => deleteConfig(config.id)} className="text-red-500 hover:text-red-700 ml-1">
                  <Trash2 size={16}/>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MyEventBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("event_bookings").select(`
      *,
      event_booking_items (*),
      event_cake_details (*)
    `).order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setBookings(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-[#8a745e]">Loading bookings...</div>;

  return (
    <div className="mx-auto max-w-[1050px]">
      <h1 className="mb-6 font-display text-3xl text-[#294b41]">My Event Bookings</h1>
      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-12 text-center text-[#88735d]">
          <PartyPopper className="mx-auto mb-4 size-12 opacity-50" />
          <p>You haven't booked any events yet.</p>
          <Link href="/events" className="mt-4 inline-block text-sm font-bold text-[#ea6b42]">Explore Events</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bookings.map(b => (
            <div key={b.id} className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5 shadow-warm-sm">
              <div className="mb-4 border-b border-[#e3d7c5] pb-4">
                <div className="font-display text-xl text-[#294b41]">{b.event_name}</div>
                <div className="text-xs font-bold text-[#ea6b42] uppercase">{b.event_type}</div>
              </div>
              
              <div className="mb-4 flex flex-col gap-1">
                 <span className="font-mono-brand text-lg font-bold text-[#ea6b42]">Event Token: #{b.event_token || 'event:--'}</span>
                 <span className="text-sm font-bold text-[#a08870]">Event Date: {new Date(b.event_date).toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, "-")}</span>
                 <span className="text-sm font-bold text-[#a08870]">Session: {formatTime12Hour(b.event_time)}</span>
              </div>

              <div className="space-y-2 text-sm text-[#5d4a38]">
                {b.venue && <div><b>Venue:</b> {b.venue} ({b.expected_participants} pax)</div>}
                {!b.venue && <div><b>Participants:</b> {b.expected_participants} pax</div>}
                <div className="flex items-center gap-2">
                  <b>Status:</b>
                  <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    (['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'ACCEPTED'].includes(b.status)) ? 'bg-[#7e9a76]/20 text-[#3b5e31]' :
                    (['REJECTED', 'CANCELLED'].includes(b.status)) ? 'bg-[#ea6b42]/20 text-[#bd5739]' :
                    'bg-[#f6cb63]/20 text-[#b58b22]'
                  }`}>{['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'].includes(b.status) ? 'ACCEPTED' : b.status === 'REJECTED' ? 'CANCELLED' : b.status}</span>
                </div>
                
                {b.event_cake_details && (
                  <div className="mt-4 pt-3 border-t border-[#e3d7c5]">
                    <div className="font-bold text-[#294b41] mb-2">Cake Details:</div>
                    <div className="rounded-lg bg-white border border-[#dcccb8] p-3 text-xs mb-2">
                      <div className="flex justify-between font-bold text-sm mb-1">
                        <span>{b.event_cake_details.cake_weight} {b.event_cake_details.cake_flavour}</span>
                        {b.event_cake_details.total_price && <span className="text-[#bd5739]">{money(b.event_cake_details.total_price)}</span>}
                      </div>
                      <div>For: {b.event_cake_details.celebration_for}</div>
                      <div>Message: "{b.event_cake_details.cake_message}"</div>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-3 border-t border-[#e3d7c5] flex justify-between items-center text-lg font-bold text-[#294b41]">
                  <span>Total Estimate:</span>
                  <span>{money(b.estimated_total)}</span>
                </div>
              </div>
              {b.status === 'REJECTED' && b.rejection_reason && (
                <div className="mt-4 rounded-xl bg-[#ea6b42]/10 p-3 text-xs text-[#bd5739]">
                  <b>Rejection Reason:</b> {b.rejection_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
