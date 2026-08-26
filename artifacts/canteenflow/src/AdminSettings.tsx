import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Image as ImageIcon, Loader2 } from "lucide-react";
import { AdminPaymentSettings } from "./AdminPaymentSettings";

export function AdminSettings({ currentSettings, onSaved }: { currentSettings: any; onSaved?: (updated: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    canteen_name: "",
    description: "",
    phone: "",
    alternate_phone: "",
    email: "",
    address: "",
    opening_time: "",
    closing_time: "",
    working_days: "",
    whatsapp: "",
    location_url: "",
    hero_badge: "",
    hero_title: "",
    hero_highlight: "",
    hero_description: "",
    hero_button_text: "",
    hero_button_link: "",
    live_message: "",
  });

  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (currentSettings) {
      setFormData({
        canteen_name: currentSettings.canteen_name || "",
        description: currentSettings.description || "",
        phone: currentSettings.phone || "",
        alternate_phone: currentSettings.alternate_phone || "",
        email: currentSettings.email || "",
        address: currentSettings.address || "",
        opening_time: currentSettings.opening_time || "",
        closing_time: currentSettings.closing_time || "",
        working_days: currentSettings.working_days || "",
        whatsapp: currentSettings.whatsapp || "",
        location_url: currentSettings.location_url || "",
        hero_badge: currentSettings.hero_badge || "",
        hero_title: currentSettings.hero_title || "",
        hero_highlight: currentSettings.hero_highlight || "",
        hero_description: currentSettings.hero_description || "",
        hero_button_text: currentSettings.hero_button_text || "",
        hero_button_link: currentSettings.hero_button_link || "",
        live_message: currentSettings.live_message || "",
      });
      if (currentSettings.hero_image) {
        setHeroImagePreview(currentSettings.hero_image);
      }
    }
  }, [currentSettings]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setHeroImage(file);
      setHeroImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let heroImageUrl = currentSettings?.hero_image || "";

      if (heroImage) {
        const fileExt = heroImage.name.split('.').pop();
        const fileName = `hero-${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('canteen-assets')
          .upload(fileName, heroImage, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('canteen-assets')
          .getPublicUrl(fileName);

        heroImageUrl = publicUrl;
      }

      const { error } = await supabase
        .from("canteen_settings")
        .update({
          ...formData,
          hero_image: heroImageUrl,
        })
        .eq("id", 1);

      if (error) throw error;
      toast.success("Settings saved successfully!");
      if (onSaved) onSaved({ ...formData, hero_image: heroImageUrl });
    } catch (err: any) {
      toast.error("Failed to save settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-[#173f37]">Canteen Settings</h2>
          <p className="text-[#8c745c]">Manage public information and hero content.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        <div className="rounded-2xl border border-[#e3d7c5] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-[#173f37]">General Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Canteen Name</label>
              <Input name="canteen_name" value={formData.canteen_name} onChange={handleChange} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Live Message Banner</label>
              <Input name="live_message" value={formData.live_message} onChange={handleChange} placeholder="e.g. Pickup is moving fast today." />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Description</label>
              <Textarea name="description" value={formData.description} onChange={handleChange} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Opening Time</label>
              <Input name="opening_time" value={formData.opening_time} onChange={handleChange} placeholder="e.g. 08:00 AM" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Closing Time</label>
              <Input name="closing_time" value={formData.closing_time} onChange={handleChange} placeholder="e.g. 06:00 PM" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Working Days</label>
              <Input name="working_days" value={formData.working_days} onChange={handleChange} placeholder="e.g. Monday - Saturday" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Primary Phone</label>
              <Input name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Alternate Phone</label>
              <Input name="alternate_phone" value={formData.alternate_phone} onChange={handleChange} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">WhatsApp Number</label>
              <Input name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="e.g. +91 9876543210" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Email Address</label>
              <Input name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Location Address</label>
              <Textarea name="address" value={formData.address} onChange={handleChange} placeholder="Full address" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Google Maps URL</label>
              <Input name="location_url" value={formData.location_url} onChange={handleChange} placeholder="https://maps.google.com/..." />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e3d7c5] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-[#173f37]">Hero Section (Home Page)</h3>
          
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-[#4a3e35]">Hero Background Image</label>
            <div className="flex items-start gap-6">
              {heroImagePreview ? (
                <div className="relative h-32 w-48 overflow-hidden rounded-xl border border-[#e3d7c5]">
                  <img src={heroImagePreview} alt="Hero preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="grid h-32 w-48 place-items-center rounded-xl border border-dashed border-[#dcccb8] bg-[#fffaf0]">
                  <ImageIcon className="text-[#dcccb8]" size={32} />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} className="max-w-xs" />
                <p className="text-xs text-[#8c745c]">Recommended size: 1920x1080px. Max 5MB (PNG, JPG, WEBP).</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Badge Text</label>
              <Input name="hero_badge" value={formData.hero_badge} onChange={handleChange} placeholder="e.g. Straight from the hostel canteen" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Main Title</label>
              <Input name="hero_title" value={formData.hero_title} onChange={handleChange} placeholder="e.g. Skip the queue." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Highlight Text (Yellow)</label>
              <Input name="hero_highlight" value={formData.hero_highlight} onChange={handleChange} placeholder="e.g. Keep the good mood." />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Description</label>
              <Textarea name="hero_description" value={formData.hero_description} onChange={handleChange} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Button Text</label>
              <Input name="hero_button_text" value={formData.hero_button_text} onChange={handleChange} placeholder="e.g. Start an order" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#4a3e35]">Button Link</label>
              <Input name="hero_button_link" value={formData.hero_button_link} onChange={handleChange} placeholder="e.g. /menu" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="bg-[#ea6b42] hover:bg-[#d65f3a]">
            {loading ? <><Loader2 size={16} className="mr-2 animate-spin" /> Saving...</> : <><Save size={16} className="mr-2" /> Save Settings</>}
          </Button>
        </div>
      </form>

      <div className="mt-8">
         <AdminPaymentSettings currentSettings={currentSettings} />
      </div>

    </div>
  );
}
