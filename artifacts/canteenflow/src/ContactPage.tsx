import React, { useState, useEffect } from "react";
import { PageIntro } from "./App";
import { Phone, Mail, MapPin, Clock, MessageSquare, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";

export function ContactPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("canteen_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div className="p-10 text-center animate-pulse text-[#8a745e]">Loading contact details...</div>;
  if (!settings) return <div className="p-10 text-center text-red-500">Failed to load contact information.</div>;
  
  const hasContact = settings.phone || settings.alternate_phone || settings.email;
  const hasHours = settings.opening_time && settings.closing_time && settings.working_days;

  return (
    <div className="mx-auto max-w-[900px] animate-rise">
      <PageIntro 
        eyebrow="We're here to help" 
        title="Contact Us." 
        sub="Reach out for support, special orders, or just to say hi." 
      />
      
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          
          <div className="rounded-2xl bg-[#173f37] p-8 text-white shadow-warm">
            <h2 className="font-display text-4xl text-[#f6cb63] mb-2">{settings.canteen_name || 'CanteenFlow'}</h2>
            {settings.description && <p className="text-[#c4d8cb] max-w-md">{settings.description}</p>}
            
            <div className="mt-8 space-y-5 border-t border-white/15 pt-8">
              {settings.address && (
                <div className="flex items-start gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f6cb63]/15 text-[#f6cb63]">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#a9c5b4]">Visit Us</h3>
                    <p className="mt-1 font-bold text-lg">{settings.address}</p>
                    {settings.location_url && (
                      <a href={settings.location_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#f6cb63] hover:underline">
                        View on Map <ChevronRight size={14} />
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              {hasContact && (
                <div className="flex items-start gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#ea6b42]/20 text-[#ea6b42]">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#a9c5b4]">Contact</h3>
                    {settings.phone && <p className="mt-1 font-bold text-lg">{settings.phone}</p>}
                    {settings.alternate_phone && <p className="font-bold text-lg text-white/80">{settings.alternate_phone}</p>}
                    {settings.email && <p className="mt-1 text-[#c4d8cb]">{settings.email}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
        
        <aside className="space-y-6">
          {hasHours && (
            <div className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-6 shadow-warm-sm">
              <div className="flex items-center gap-2 font-bold text-[#294b41] mb-4">
                <Clock size={18} className="text-[#ea6b42]" /> Working Hours
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-[#e3d7c5] pb-2">
                  <span className="text-[#8a745e]">Days</span>
                  <span className="font-bold text-[#294b41] text-right">{settings.working_days}</span>
                </div>
                <div className="flex justify-between border-b border-[#e3d7c5] pb-2">
                  <span className="text-[#8a745e]">Opening</span>
                  <span className="font-bold text-[#294b41] text-right">{settings.opening_time}</span>
                </div>
                <div className="flex justify-between border-b border-[#e3d7c5] pb-2">
                  <span className="text-[#8a745e]">Closing</span>
                  <span className="font-bold text-[#294b41] text-right">{settings.closing_time}</span>
                </div>
              </div>
            </div>
          )}
          
          {settings.whatsapp && (
            <a 
              href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-between rounded-2xl bg-[#25D366] p-5 text-white shadow-md hover:bg-[#128C7E] transition group"
            >
              <div>
                <h3 className="font-bold text-lg">WhatsApp Us</h3>
                <p className="text-sm text-white/80">Get fast support.</p>
              </div>
              <div className="grid size-10 place-items-center rounded-full bg-white/20 group-hover:bg-white/30 transition">
                <MessageSquare size={18} />
              </div>
            </a>
          )}
          
          <div className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-6 shadow-warm-sm">
            <h3 className="font-bold text-[#294b41]">Need help with an order?</h3>
            <p className="mt-2 text-sm text-[#8a745e]">Check your order status or track a delivery directly from your account.</p>
            <Link href="/orders" className="mt-4 block w-full rounded-xl bg-[#e3d7c5] px-4 py-2.5 text-center text-sm font-bold text-[#294b41] hover:bg-[#d8c8b3] transition">
              View My Orders
            </Link>
          </div>
        </aside>
      </div>
      
    </div>
  );
}
