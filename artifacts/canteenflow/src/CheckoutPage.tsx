import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useCart, usePersisted, DEFAULT_PROFILE, readStore, money, format12Hour, Empty, PageIntro, DbPickupSlot } from './App';
import { Check, CreditCard, WalletCards, Copy, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CheckoutPage({ cart, canteenStatus, settings }: { cart: ReturnType<typeof useCart>, canteenStatus?: "OPEN" | "CLOSED", settings?: any }) {
  const [, navigate] = useLocation(); 
  const [selected, setSelected] = useState(""); 
  const [payment, setPayment] = useState<"upi" | "cash">("cash"); 
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

  // UPI Payment State
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<string | null>(null);
  const [paymentUtr, setPaymentUtr] = useState("");
  const upiEnabled = settings?.upi_enabled;
  
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
    
    if (payment === "upi" && !paymentScreenshot) {
      alert("Please upload the payment screenshot to proceed.");
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
    
    // If UPI, upload screenshot first
    let screenshotUrl = "";
    if (payment === "upi" && paymentScreenshot) {
      const fileExt = paymentScreenshot.name.split(".").pop();
      const fileName = `proof_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, paymentScreenshot);
      
      if (uploadError) {
        alert("Failed to upload payment screenshot. Please try again.");
        setPlacing(false);
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);
        
      screenshotUrl = publicUrl;
    }

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
    
    // Update payment info if UPI
    if (payment === "upi" && orderId) {
      await supabase.from("orders").update({
        payment_method: "UPI",
        payment_status: "VERIFICATION_PENDING",
        payment_screenshot_url: screenshotUrl,
        payment_utr: paymentUtr,
        payment_upi_id_snapshot: settings?.upi_id,
        payment_account_name_snapshot: settings?.upi_account_name || settings?.upi_display_name
      }).eq("id", orderId);
    }

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
  })}</div>}</section><section><h2 className="mb-3 font-display text-2xl text-[#294b41]">03 / Payment</h2><div className="grid gap-3 sm:grid-cols-2">
  
  {upiEnabled && (
    <button onClick={() => setPayment("upi")} className={`flex items-center gap-3 rounded-2xl border p-4 text-left ${payment === "upi" ? "border-[#173f37] bg-[#eaf2ec]" : "border-[#e3d7c5] bg-[#fffaf0]"}`}>
      <span className="grid size-10 place-items-center rounded-xl bg-[#f2e7d8]"><CreditCard size={20} /></span>
      <span><b className="block">UPI</b><small className="text-[#89735d]">Pay via any UPI App</small></span>
      {payment === "upi" && <Check className="ml-auto" size={17} />}
    </button>
  )}
  <button onClick={() => setPayment("cash")} className={`flex items-center gap-3 rounded-2xl border p-4 text-left ${payment === "cash" ? "border-[#173f37] bg-[#eaf2ec]" : "border-[#e3d7c5] bg-[#fffaf0]"}`}>
    <span className="grid size-10 place-items-center rounded-xl bg-[#f2e7d8]"><WalletCards size={20} /></span>
    <span><b className="block">Cash on pickup</b><small className="text-[#89735d]">Keep it exact, keep it moving</small></span>
    {payment === "cash" && <Check className="ml-auto" size={17} />}
  </button>
  
  </div>
  
  {payment === "upi" && upiEnabled && (
    <div className="mt-5 rounded-2xl border border-[#e3d7c5] bg-white p-5 animate-rise shadow-sm">
      <div className="flex flex-col items-center mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#a08870] mb-1">Amount to Pay</p>
        <p className="font-mono-brand text-4xl font-bold text-[#294b41]">{money(cart.total)}</p>
      </div>

      <div className="bg-[#fffaf0] rounded-xl border border-[#e3d7c5] p-5 text-center mb-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#846d55]">Pay To:</p>
        <p className="font-bold text-lg text-[#294b41] mt-1">{settings?.upi_display_name || settings?.upi_account_name}</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-[#e3d7c5] cursor-pointer hover:border-[#ea6b42] transition" onClick={() => { navigator.clipboard.writeText(settings?.upi_id || ""); alert("UPI ID copied to clipboard!"); }}>
          <span className="font-mono-brand text-sm text-[#bd5739] font-bold">{settings?.upi_id}</span>
          <Copy size={14} className="text-[#846d55]" />
        </div>
        {settings?.upi_qr_url && (
          <div className="mt-5">
            <p className="text-xs font-bold text-[#846d55] mb-2 uppercase tracking-wide">Scan & Pay</p>
            <img src={settings.upi_qr_url} alt="UPI QR Code" className="w-48 h-48 object-contain mx-auto rounded-xl border-4 border-white shadow-sm" />
          </div>
        )}
      </div>

      <div className="mb-6 bg-[#f4ece1] p-3.5 rounded-xl border border-[#e3d7c5] text-sm text-[#5a4838] whitespace-pre-wrap leading-relaxed">
        <span className="block font-bold text-xs uppercase tracking-widest text-[#bd5739] mb-1">Instructions</span>
        {settings?.payment_instructions}
      </div>

      <div className="space-y-4 pt-5 border-t border-[#e3d7c5]">
        <div>
          <label className="text-sm font-bold text-[#294b41] mb-2 block">Payment Screenshot <span className="text-red-500">*</span></label>
          {paymentScreenshotPreview ? (
            <div className="relative inline-block">
              <img src={paymentScreenshotPreview} alt="Screenshot" className="h-32 rounded-xl border border-[#e3d7c5] object-cover" />
              <button onClick={() => { setPaymentScreenshot(null); setPaymentScreenshotPreview(null); }} className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow-sm"><X size={12} /></button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-[#dcccb8] bg-[#fffaf0] hover:bg-[#fcf5eb] transition cursor-pointer">
              <Upload size={20} className="text-[#a08870] mb-2" />
              <span className="text-sm font-bold text-[#846d55]">Upload Screenshot</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setPaymentScreenshot(e.target.files[0]);
                  setPaymentScreenshotPreview(URL.createObjectURL(e.target.files[0]));
                }
              }} />
            </label>
          )}
        </div>
        <div>
          <label className="text-sm font-bold text-[#294b41] mb-2 block">Transaction ID / UTR <span className="text-[#a08870] font-normal">(Optional)</span></label>
          <input type="text" value={paymentUtr} onChange={(e) => setPaymentUtr(e.target.value)} placeholder="e.g. 123456789012" className="h-12 w-full rounded-xl border border-[#dcccb8] bg-[#fffaf0] px-4 text-sm outline-none focus:border-[#e27752]" />
        </div>
      </div>
    </div>
  )}

  </section></div><aside className="h-fit rounded-2xl bg-[#173f37] p-5 text-white lg:sticky lg:top-[96px]"><h2 className="font-display text-2xl">Your order</h2>{cart.cart.map((item: any) => <div key={item.id} className="mt-4 flex justify-between gap-3 text-sm text-[#c7d8cb]"><span>{item.quantity} × {item.name}</span><span>{money(item.price * item.quantity)}</span></div>)}<div className="mt-5 flex justify-between border-t border-white/15 pt-4 font-bold"><span>Total</span><span className="text-[#f6cb63]">{money(cart.total)}</span></div><Button variant="default" className="mt-5 w-full py-3.5" onClick={submit} disabled={!recipientName || !recipientPhone || !recipientRoom || !selected || placing || canteenStatus === "CLOSED" || (payment === "upi" && !paymentScreenshot)}>{canteenStatus === "CLOSED" ? "Canteen is Closed" : placing ? "Processing..." : payment === "upi" ? "Submit Payment Proof" : "Place order"}</Button><p className="mt-3 text-center text-[11px] text-[#a9c0b1]">{payment === "upi" ? "Ensure you have paid the exact amount." : "No real payment will be charged."}</p></aside></div></div>;
}
