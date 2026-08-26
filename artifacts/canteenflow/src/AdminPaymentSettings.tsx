import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { QrCode, Upload, X, Save, Trash2, Camera, User, Phone, Check, Copy, Loader2, QrCode as QrCodeIcon } from "lucide-react";
import { toast } from "sonner";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AdminPaymentSettings({ currentSettings }: { currentSettings: any }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    upi_enabled: false,
    upi_id: "",
    upi_account_name: "",
    upi_display_name: "",
    payment_instructions: "Scan the QR code and pay the exact order amount. After payment, upload the payment screenshot for verification.",
    upi_qr_url: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [rawImageFileUrl, setRawImageFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentSettings) {
      setFormData({
        upi_enabled: currentSettings.upi_enabled || false,
        upi_id: currentSettings.upi_id || "",
        upi_account_name: currentSettings.upi_account_name || "",
        upi_display_name: currentSettings.upi_display_name || "",
        payment_instructions: currentSettings.payment_instructions || "Scan the QR code and pay the exact order amount. After payment, upload the payment screenshot for verification.",
        upi_qr_url: currentSettings.upi_qr_url || "",
      });
      setImagePreview(currentSettings.upi_qr_url || null);
    }
  }, [currentSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("File must be an image");
        return;
      }
      setRawImageFileUrl(URL.createObjectURL(file));
      setIsCropModalOpen(true);
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
      // We don't force an aspect ratio for QR codes, they are typically square (1:1)
      const croppedImage = await getCroppedImg(rawImageFileUrl, croppedAreaPixels, 0);
      if (croppedImage) {
        setImageFile(croppedImage);
        setImagePreview(URL.createObjectURL(croppedImage));
        setIsCropModalOpen(false);
      }
    } catch (e: any) {
      toast.error("Failed to crop image", { description: e.message });
    }
  };

  const removeQrCode = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, upi_qr_url: "" });
  };

  const handleSave = async () => {
    // Validation
    if (formData.upi_enabled) {
      if (!formData.upi_id?.trim()) {
        toast.error("UPI ID is required when UPI is enabled.");
        return;
      }
      if (!formData.upi_account_name?.trim()) {
        toast.error("Account Holder Name is required when UPI is enabled.");
        return;
      }
    }

    setLoading(true);
    let finalQrUrl = formData.upi_qr_url;

    try {
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `qr_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("canteen-assets")
          .upload(fileName, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("canteen-assets")
          .getPublicUrl(fileName);

        finalQrUrl = publicUrl;
      }

      const { error } = await supabase
        .from("canteen_settings")
        .update({
          upi_enabled: formData.upi_enabled,
          upi_id: formData.upi_id.trim(),
          upi_account_name: formData.upi_account_name.trim(),
          upi_display_name: formData.upi_display_name.trim(),
          payment_instructions: formData.payment_instructions.trim(),
          upi_qr_url: finalQrUrl,
        })
        .eq("id", 1);

      if (error) throw error;
      toast.success("Payment settings updated successfully ✓");
      
      // Update local state to reflect the new saved QR URL if a new file was uploaded
      if (imageFile) {
        setFormData({ ...formData, upi_qr_url: finalQrUrl });
        setImageFile(null); // Clear pending file upload state
      }

    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-rise space-y-6 pb-24">
      
      <div className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl text-[#294b41]">Payment Settings</h2>
            <p className="text-sm text-[#846d55]">Configure UPI payments for student checkouts.</p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer bg-white border border-[#e3d7c5] px-4 py-2 rounded-xl shadow-warm-sm hover:border-[#ea6b42] transition">
            <span className="text-sm font-bold text-[#294b41]">Enable UPI</span>
            <input 
              type="checkbox" 
              name="upi_enabled" 
              checked={formData.upi_enabled} 
              onChange={handleChange} 
              className="w-5 h-5 accent-[#ea6b42] cursor-pointer"
            />
          </label>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#294b41]">
                UPI ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="upi_id"
                value={formData.upi_id}
                onChange={handleChange}
                placeholder="e.g. jkkcanteen@upi"
                className="w-full rounded-xl border border-[#e3d7c5] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea6b42]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#294b41]">
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="upi_account_name"
                value={formData.upi_account_name}
                onChange={handleChange}
                placeholder="e.g. JKK Canteen"
                className="w-full rounded-xl border border-[#e3d7c5] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea6b42]"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#294b41]">Display Name (Optional)</label>
            <input
              type="text"
              name="upi_display_name"
              value={formData.upi_display_name}
              onChange={handleChange}
              placeholder="e.g. JKK Munirajah Canteen"
              className="w-full rounded-xl border border-[#e3d7c5] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea6b42]"
            />
            <p className="mt-1 text-xs text-[#846d55]">This name will be shown to students instead of the account holder name if provided.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#294b41]">Payment Instructions</label>
            <textarea
              name="payment_instructions"
              value={formData.payment_instructions}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-xl border border-[#e3d7c5] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea6b42]"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-6">
          <h2 className="mb-2 font-display text-2xl text-[#294b41]">UPI QR Code</h2>
          <p className="mb-6 text-sm text-[#846d55]">Upload your official UPI QR code.</p>

          {imagePreview ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative border-4 border-[#e3d7c5] rounded-xl overflow-hidden bg-white p-2">
                <img src={imagePreview} alt="QR Code Preview" className="w-48 h-48 object-contain" />
              </div>
              <div className="flex gap-3">
                <label className="cursor-pointer rounded-xl bg-[#294b41] px-4 py-2 text-sm font-bold text-white hover:bg-[#1f3a32] transition">
                  Change QR
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>
                <button onClick={removeQrCode} className="rounded-xl px-4 py-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 transition">
                  Remove QR
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#dcccb8] bg-white/50 py-12">
              <QrCodeIcon size={48} className="text-[#a08870] mb-3 opacity-50" />
              <p className="text-sm font-bold text-[#846d55]">No QR Code configured</p>
              <label className="mt-4 cursor-pointer inline-flex items-center gap-2 rounded-xl border border-[#dcccb8] bg-white px-4 py-2 text-sm font-bold text-[#294b41] hover:bg-[#f7eee1] transition shadow-sm">
                <Upload size={16} /> Upload QR Code
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#e3d7c5] bg-white p-6 shadow-warm-sm">
          <h2 className="mb-4 font-display text-xl text-[#294b41]">Student Payment Preview</h2>
          <div className="rounded-2xl border border-[#e3d7c5] bg-[#fffaf0] p-5">
            <div className="text-center mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#a08870]">Amount to Pay</p>
              <p className="font-mono-brand text-4xl font-bold text-[#294b41] mt-2">₹120.00</p>
            </div>
            
            <div className="bg-white rounded-xl border border-[#e3d7c5] p-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#846d55]">Pay To:</p>
              <p className="font-bold text-lg text-[#294b41] mt-1">{formData.upi_display_name || formData.upi_account_name || "Account Name"}</p>
              <div className="mt-3 inline-flex items-center gap-2 bg-[#f4ece1] rounded-lg px-3 py-1.5 border border-[#e3d7c5]">
                <span className="font-mono-brand text-sm text-[#bd5739] font-bold">{formData.upi_id || "upi@id"}</span>
                <Copy size={14} className="text-[#846d55]" />
              </div>
            </div>

            {imagePreview && (
              <div className="mt-4 bg-white rounded-xl border border-[#e3d7c5] p-4 flex flex-col items-center">
                <p className="text-xs font-bold text-[#846d55] mb-3">Scan & Pay</p>
                <img src={imagePreview} className="w-32 h-32 object-contain rounded-lg" alt="QR Code" />
              </div>
            )}

            <div className="mt-4 text-sm text-[#5a4838] bg-[#f4ece1] p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
              <span className="font-bold text-xs uppercase tracking-wider text-[#bd5739] block mb-1">Instructions:</span>
              {formData.payment_instructions}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-[236px] bg-white/80 backdrop-blur-md border-t border-[#e3d7c5] p-4 flex justify-end z-30">
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-[#294b41] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#1a312a] transition disabled:opacity-70"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {loading ? "Saving..." : "Save Payment Settings"}
        </button>
      </div>

      {/* Crop Modal */}
      <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crop QR Code</DialogTitle>
          </DialogHeader>
          <div className="relative h-[400px] w-full bg-black/5 rounded-xl overflow-hidden mt-4">
            {rawImageFileUrl && (
              <Cropper
                image={rawImageFileUrl}
                crop={crop}
                zoom={zoom}
                aspect={1} // 1:1 Aspect ratio for QR Codes
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
