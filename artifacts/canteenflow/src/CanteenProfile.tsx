import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function AdminCanteenProfile({ currentSettings }: { currentSettings: any }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [rawImageFileUrl, setRawImageFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentSettings) {
      setFormData(currentSettings);
      setImagePreview(currentSettings.hero_image || null);
    }
  }, [currentSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("File must be an image");
        return;
      }
      setRawImageFileUrl(URL.createObjectURL(file));
      setIsCropModalOpen(true);
      // Reset original crop values
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const applyCrop = async () => {
    try {
      if (!rawImageFileUrl || !croppedAreaPixels) return;
      const croppedImage = await getCroppedImg(
        rawImageFileUrl,
        croppedAreaPixels,
        0
      );
      if (croppedImage) {
        setImageFile(croppedImage);
        setImagePreview(URL.createObjectURL(croppedImage));
        setIsCropModalOpen(false);
      }
    } catch (e: any) {
      toast.error("Failed to crop image", { description: e.message });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    let finalImageUrl = formData.hero_image;

    try {
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `hero_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('canteen-assets')
          .upload(filePath, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('canteen-assets')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('canteen_settings')
        .update({
          canteen_name: formData.canteen_name,
          description: formData.description,
          phone: formData.phone,
          alternate_phone: formData.alternate_phone,
          email: formData.email,
          address: formData.address,
          opening_time: formData.opening_time,
          closing_time: formData.closing_time,
          working_days: formData.working_days,
          whatsapp: formData.whatsapp,
          location_url: formData.location_url,
          hero_image: finalImageUrl,
          hero_badge: formData.hero_badge,
          hero_title: formData.hero_title,
          hero_highlight: formData.hero_highlight,
          hero_description: formData.hero_description,
          hero_button_text: formData.hero_button_text,
          hero_button_link: formData.hero_button_link,
          live_message: formData.live_message
        })
        .eq('id', 1);

      if (error) throw error;

      toast.success("Canteen profile updated successfully!");
      setImageFile(null);
    } catch (err: any) {
      toast.error("Failed to save changes", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return <div className="p-8 text-center text-[#8a745e] animate-pulse">Loading CMS...</div>;

  return (
    <div className="space-y-8 animate-rise pb-20">
      
      {/* 1. Basic Information */}
      <section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-6 shadow-warm-sm">
        <h2 className="font-display text-2xl text-[#294b41] mb-5 border-b border-[#e3d7c5] pb-4">Basic Information</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-bold text-[#294b41]">Canteen Name
            <input name="canteen_name" value={formData.canteen_name || ''} onChange={handleChange} className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-white px-4 text-sm focus:border-[#ea6b42] outline-none transition" />
          </label>
          <label className="text-sm font-bold text-[#294b41]">Description
            <textarea name="description" value={formData.description || ''} onChange={handleChange} className="mt-2 min-h-[48px] w-full rounded-xl border border-[#dcccb8] bg-white px-4 py-3 text-sm focus:border-[#ea6b42] outline-none transition resize-y" />
          </label>
        </div>
      </section>

      {/* 2. Contact Information */}
      <section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-6 shadow-warm-sm">
        <h2 className="font-display text-2xl text-[#294b41] mb-5 border-b border-[#e3d7c5] pb-4">Contact Information</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-bold text-[#294b41]">Primary Phone
            <input name="phone" value={formData.phone || ''} onChange={handleChange} className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-white px-4 text-sm focus:border-[#ea6b42] outline-none transition" />
          </label>
          <label className="text-sm font-bold text-[#294b41]">Email Address
            <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-white px-4 text-sm focus:border-[#ea6b42] outline-none transition" />
          </label>
          <label className="text-sm font-bold text-[#294b41] md:col-span-2">Physical Address
            <input name="address" value={formData.address || ''} onChange={handleChange} className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-white px-4 text-sm focus:border-[#ea6b42] outline-none transition" />
          </label>
        </div>
      </section>

      {/* 3. Working Hours */}
      <section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-6 shadow-warm-sm">
        <h2 className="font-display text-2xl text-[#294b41] mb-5 border-b border-[#e3d7c5] pb-4">Working Hours</h2>
        <div className="grid gap-5 md:grid-cols-3">
          <label className="text-sm font-bold text-[#294b41]">Opening Time
            <input name="opening_time" value={formData.opening_time || ''} onChange={handleChange} placeholder="e.g. 8:00 AM" className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-white px-4 text-sm focus:border-[#ea6b42] outline-none transition" />
          </label>
          <label className="text-sm font-bold text-[#294b41]">Closing Time
            <input name="closing_time" value={formData.closing_time || ''} onChange={handleChange} placeholder="e.g. 6:00 PM" className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-white px-4 text-sm focus:border-[#ea6b42] outline-none transition" />
          </label>
          <label className="text-sm font-bold text-[#294b41]">Working Days
            <input name="working_days" value={formData.working_days || ''} onChange={handleChange} placeholder="e.g. Monday - Saturday" className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-white px-4 text-sm focus:border-[#ea6b42] outline-none transition" />
          </label>
        </div>
      </section>

      {/* 4. Live Canteen Message */}
      <section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-6 shadow-warm-sm">
        <h2 className="font-display text-2xl text-[#294b41] mb-5 border-b border-[#e3d7c5] pb-4">Live Canteen Message</h2>
        <label className="text-sm font-bold text-[#294b41]">Student Home Message
          <textarea name="live_message" value={formData.live_message || ''} onChange={handleChange} className="mt-2 min-h-[80px] w-full rounded-xl border border-[#dcccb8] bg-white px-4 py-3 text-sm focus:border-[#ea6b42] outline-none transition resize-y" />
        </label>
      </section>

      {/* 5. Hero Banner */}
      <section className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-6 shadow-warm-sm">
        <h2 className="font-display text-2xl text-[#294b41] mb-5 border-b border-[#e3d7c5] pb-4">Hero Banner</h2>
        
        <div className="mb-8">
          <label className="text-sm font-bold text-[#294b41] block mb-3">Hero Image</label>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-full sm:w-64 h-40 bg-[#e3d7c5] rounded-xl overflow-hidden flex-shrink-0 border-2 border-dashed border-[#c6b6a0] relative">
              {imagePreview ? (
                <img src={imagePreview} alt="Hero Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#8a745e]">
                  <ImageIcon size={32} className="mb-2 opacity-50" />
                  <span className="text-xs font-bold uppercase tracking-wider">No Image</span>
                </div>
              )}
            </div>
            <div className="flex-1 w-full space-y-3">
              <p className="text-sm text-[#8a745e]">Upload a high-quality landscape image (JPG, PNG, WebP) under 5MB. If no image is provided, a solid background color will be used.</p>
              <div className="relative inline-block">
                <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <button type="button" className="flex items-center gap-2 rounded-xl bg-white border border-[#dcccb8] px-4 py-2.5 text-sm font-bold text-[#173f37] hover:bg-[#f7f0e5] transition">
                  <Upload size={16} /> Choose Image
                </button>
              </div>
              {imageFile && <p className="text-xs font-bold text-[#26735a]">✓ {imageFile.name}</p>}
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-bold text-[#294b41]">Hero Badge
            <input name="hero_badge" value={formData.hero_badge || ''} onChange={handleChange} className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-white px-4 text-sm focus:border-[#ea6b42] outline-none transition" />
          </label>
          <label className="text-sm font-bold text-[#294b41]">Hero Title
            <input name="hero_title" value={formData.hero_title || ''} onChange={handleChange} className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-white px-4 text-sm focus:border-[#ea6b42] outline-none transition" />
          </label>
          <label className="text-sm font-bold text-[#294b41]">Hero Highlight (Subtitle)
            <input name="hero_highlight" value={formData.hero_highlight || ''} onChange={handleChange} className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-white px-4 text-sm focus:border-[#ea6b42] outline-none transition" />
          </label>
          <label className="text-sm font-bold text-[#294b41]">Button Text
            <input name="hero_button_text" value={formData.hero_button_text || ''} onChange={handleChange} className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-white px-4 text-sm focus:border-[#ea6b42] outline-none transition" />
          </label>
          <label className="text-sm font-bold text-[#294b41]">Button Link
            <input name="hero_button_link" value={formData.hero_button_link || ''} onChange={handleChange} className="mt-2 h-12 w-full rounded-xl border border-[#dcccb8] bg-white px-4 text-sm focus:border-[#ea6b42] outline-none transition" />
          </label>
          <label className="text-sm font-bold text-[#294b41] md:col-span-2">Hero Description
            <textarea name="hero_description" value={formData.hero_description || ''} onChange={handleChange} className="mt-2 min-h-[80px] w-full rounded-xl border border-[#dcccb8] bg-white px-4 py-3 text-sm focus:border-[#ea6b42] outline-none transition resize-y" />
          </label>
        </div>
      </section>

      {/* Floating Save Button */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-[236px] bg-white/80 backdrop-blur-md border-t border-[#e3d7c5] p-4 flex justify-end z-30">
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-[#294b41] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#1a312a] transition disabled:opacity-70"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crop Hero Image</DialogTitle>
          </DialogHeader>
          <div className="relative h-[400px] w-full bg-black/5 rounded-xl overflow-hidden mt-4">
            {rawImageFileUrl && (
              <Cropper
                image={rawImageFileUrl}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <label className="text-xs font-bold text-[#8a745e]">Zoom</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#ea6b42]"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setIsCropModalOpen(false)} className="rounded-xl px-4 py-2 font-bold text-[#8a745e] hover:bg-[#f7f0e5]">Cancel</button>
            <button onClick={applyCrop} className="rounded-xl bg-[#ea6b42] px-4 py-2 font-bold text-white hover:bg-[#c65d3c]">Apply Crop</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
