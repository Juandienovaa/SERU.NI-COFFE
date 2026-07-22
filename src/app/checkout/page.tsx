"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  User, 
  Phone, 
  FileText, 
  Navigation, 
  CreditCard,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useOnlineCart } from "@/store/useOnlineCart";
import Link from "next/link";
import Image from "next/image";
import Swal from 'sweetalert2';

// Outlet Coordinates (Mocked as Tanjungpinang center for distance calc)
const OUTLET_LAT = 0.9167;
const OUTLET_LON = 104.4500;

// Calculate distance in km using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; 
  return d;
}

const checkoutSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  phone: z.string().min(9, "Nomor WhatsApp tidak valid"),
  notes: z.string().optional(),
  address: z.string().min(10, "Alamat lengkap wajib diisi"),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useOnlineCart((state) => state.items);
  const getSubtotal = useOnlineCart((state) => state.getSubtotal);
  const [mounted, setMounted] = useState(false);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number>(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      phone: "",
      notes: "",
      address: "",
      latitude: null,
      longitude: null
    },
    mode: "onChange"
  });

  const watchLat = watch("latitude");
  const watchLon = watch("longitude");
  const watchAddress = watch("address");

  useEffect(() => {
    setMounted(true);
    if (cart.length === 0) {
      router.replace("/menu-online");
    }
  }, [cart, router]);

  useEffect(() => {
    if (watchLat && watchLon) {
      const dist = calculateDistance(OUTLET_LAT, OUTLET_LON, watchLat, watchLon);
      setDistanceKm(dist);
    }
  }, [watchLat, watchLon]);

  const subtotal = getSubtotal();
  // Dynamic delivery fee calculation: Base Rp 5.000 + Rp 2.000 per KM.
  // Free if subtotal > 50000.
  const isFreeOngkir = subtotal >= 50000;
  const calculatedOngkir = isFreeOngkir ? 0 : 5000 + (Math.ceil(distanceKm) * 2000);
  const total = subtotal + calculatedOngkir;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Geolocation tidak didukung di browser ini.',
        background: '#18181b', color: '#fff'
      });
      return;
    }

    setIsLoadingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setValue("latitude", latitude, { shouldValidate: true });
        setValue("longitude", longitude, { shouldValidate: true });
        
        try {
          // Reverse Geocoding using OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data && data.display_name) {
            setValue("address", data.display_name, { shouldValidate: true });
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Lokasi berhasil ditemukan',
              showConfirmButton: false,
              timer: 3000,
              background: '#18181b', color: '#fff'
            });
          }
        } catch (error) {
          console.error("Geocoding failed", error);
        } finally {
          setIsLoadingGPS(false);
        }
      },
      (error) => {
        setIsLoadingGPS(false);
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Tidak dapat mengakses lokasi Anda. Mohon izinkan akses lokasi.',
          background: '#18181b', color: '#fff'
        });
      },
      { enableHighAccuracy: true }
    );
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsSubmitting(true);
    
    // Store checkout data in sessionStorage to pass to Payment page
    const orderPayload = {
      customer: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        lat: data.latitude,
        lng: data.longitude,
        distance_km: distanceKm.toFixed(1)
      },
      cart: cart,
      financial: {
        subtotal,
        delivery_fee: calculatedOngkir,
        total
      }
    };
    
    sessionStorage.setItem("current_checkout", JSON.stringify(orderPayload));
    
    // Simulate network delay for premium feel
    setTimeout(() => {
      router.push("/payment");
    }, 1000);
  };

  const formatRp = (num: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  if (!mounted || cart.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#09090B] pb-24 selection:bg-orange-500/30">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-[#09090B]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/menu-online" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm">Kembali</span>
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="text-white font-bold tracking-wide">Checkout</h1>
            <p className="text-xs text-orange-400 font-medium">Delivery Information</p>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
        
        {/* Background Decorative */}
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/10 blur-[150px] pointer-events-none rounded-full" />

        {/* Form Section */}
        <div className="lg:col-span-7 relative z-10 space-y-8">
          <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Customer Info Box */}
            <div className="bg-[#121217]/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Informasi Penerima</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Nama Lengkap</label>
                  <input 
                    {...register("name")}
                    placeholder="Budi Santoso"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Nomor WhatsApp</label>
                  <input 
                    {...register("phone")}
                    type="tel"
                    placeholder="081234567890"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                  {errors.phone && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Catatan Pesanan (Opsional)</label>
                  <textarea 
                    {...register("notes")}
                    placeholder="Misal: Es dipisah, gulanya dikit aja ya kak"
                    rows={2}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Address & GPS Box */}
            <div className="bg-[#121217]/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-orange-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Alamat Pengiriman</h2>
              </div>
              
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLoadingGPS}
                  className="w-full relative overflow-hidden group flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 py-4 rounded-xl font-bold text-sm transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-blue-400/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  {isLoadingGPS ? (
                    <><Loader2 className="w-4 h-4 animate-spin relative z-10" /> <span className="relative z-10">Mencari Lokasi...</span></>
                  ) : (
                    <><Navigation className="w-4 h-4 relative z-10" /> <span className="relative z-10">Ambil Lokasi Saya (GPS)</span></>
                  )}
                </button>

                {watchLat && watchLon && (
                  <div className="rounded-xl overflow-hidden border border-white/10 relative h-48 bg-black/20">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${watchLon-0.005},${watchLat-0.005},${watchLon+0.005},${watchLat+0.005}&layer=mapnik&marker=${watchLat},${watchLon}`}
                      allowFullScreen
                    ></iframe>
                    <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md rounded-lg p-2 text-[10px] text-white flex justify-between items-center border border-white/10">
                      <span>{watchLat.toFixed(6)}, {watchLon.toFixed(6)}</span>
                      <span className="text-orange-400 font-bold">{distanceKm.toFixed(1)} km dari outlet</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Detail Alamat</label>
                  <textarea 
                    {...register("address")}
                    placeholder="Nama Jalan, Gedung, RT/RW, Patokan"
                    rows={3}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all resize-none"
                  />
                  {errors.address && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.address.message}</p>}
                  {!watchLat && <p className="text-orange-400/80 text-xs mt-2 italic flex items-center gap-1"><AlertCircle className="w-3 h-3"/>Direkomendasikan menggunakan tombol "Ambil Lokasi Saya" agar kurir mudah menemukan Anda.</p>}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary Section */}
        <div className="lg:col-span-5 relative z-10">
          <div className="sticky top-28 bg-[#121217] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Ringkasan Pesanan
            </h2>

            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-black/20 shrink-0 relative overflow-hidden border border-white/5">
                    {item.product.image ? (
                      <Image src={item.product.image} alt={item.product.product_name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-neutral-800" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white line-clamp-1">{item.product.product_name}</h4>
                    <p className="text-xs text-neutral-400 mt-1">{item.qty}x @ {formatRp(item.product.price || 0)}</p>
                    <p className="text-sm font-bold text-orange-400 mt-1">{formatRp((item.product.price || 0) * item.qty)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px w-full bg-white/5 my-6" />

            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-sm text-neutral-400">
                <span>Subtotal</span>
                <span className="text-white font-medium">{formatRp(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-400">
                <span>Biaya Pengiriman</span>
                <span className="text-white font-medium">
                  {calculatedOngkir === 0 ? <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs">GRATIS</span> : formatRp(calculatedOngkir)}
                </span>
              </div>
              {distanceKm > 0 && (
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Jarak (Estimasi)</span>
                  <span>{distanceKm.toFixed(1)} km</span>
                </div>
              )}
              
              <div className="h-px w-full bg-white/5 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Total Pembayaran</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                  {formatRp(total)}
                </span>
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6 flex gap-3">
              <CreditCard className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white mb-1">Pembayaran via QRIS</p>
                <p className="text-xs text-neutral-400">Metode pembayaran cepat dan aman menggunakan e-Wallet atau Mobile Banking.</p>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={!isValid || isSubmitting}
              className={`group relative flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden ${
                (!isValid || isSubmitting)
                ? "bg-white/5 text-neutral-500 cursor-not-allowed" 
                : "bg-orange-500 hover:bg-orange-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:scale-[1.02]"
              }`}
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
              ) : (
                <>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  <span className="relative z-10">Bayar Sekarang</span>
                  <CheckCircle2 className="w-4 h-4 relative z-10" />
                </>
              )}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
