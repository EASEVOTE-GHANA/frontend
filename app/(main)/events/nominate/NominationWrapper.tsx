"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  UploadCloud,
  CheckCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Instagram,
  FileText,
  MessageCircle,
  ChevronRight,
  Calendar,
  MapPin,
  ChevronDown,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { clsx } from "clsx";

interface NominationWrapperProps {
  event: any;
  formConfig: any;
}

export default function NominationWrapper({
  event,
  formConfig,
}: NominationWrapperProps) {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Welcome, 2: Form
  const nominationType = "SELF"; 
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [submittedNominee, setSubmittedNominee] = useState<any>(null);

  const customFieldsConfig = formConfig?.customFields || formConfig?.fields || [];

  const [photoUrl, setPhotoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      categoryId: "",
      fullName: "",
      email: "",
      phone: "",
      bio: "",
    } as any,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size is too large (max 5MB)");
      return;
    }

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("folder", `nominations/${event.id}`);

      const response = await api.uploadFormData<{ url: string; success: boolean }>(
        "/upload/public",
        fd
      );

      if (response.success || response.url) {
        setPhotoUrl(response.url);
        toast.success("Photo uploaded successfully");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!photoUrl) {
      toast.error("Please upload a profile photo");
      document.getElementById('photo-field')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const customFields = customFieldsConfig.map((field: any) => ({
        question: field.question,
        answer: data[field.question] || "",
      }));

      const payload = {
        eventId: event.id,
        categoryId: data.categoryId,
        nomineeName: data.fullName,
        nomineePhone: data.phone,
        bio: data.bio,
        photoUrl: photoUrl,
        customFields,
        nominatorName: data.fullName,
        nominatorPhone: data.phone,
        email: data.email,
      };

      const result = await api.post(`/nominations/events/${event.id}/submit`, payload);

      if (result) {
        setSubmittedNominee({
          fullName: data.fullName,
          email: data.email,
          photoUrl: photoUrl
        });
        setTrackingCode(result._id?.substring(0, 8).toUpperCase() || "SUCCESS");
        setIsSuccess(true);
        window.scrollTo(0, 0);
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 md:p-10 font-display">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 text-center border border-slate-100 relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
          
          <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-8 border border-green-100">
            <CheckCircle className="text-green-600" size={40} strokeWidth={2} />
          </div>

          <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Nominated!
          </h2>
          <p className="text-slate-500 mb-10 text-lg font-medium">
            Your nomination for <strong>{event.title}</strong> has been received.
          </p>

          {/* Nominee Summary Card */}
          <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-10 border border-slate-100 flex flex-col items-center">
             <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl mb-4 bg-slate-200">
                {submittedNominee?.photoUrl && (
                  <img src={submittedNominee.photoUrl} alt={submittedNominee.fullName} className="w-full h-full object-cover" />
                )}
             </div>
             <h3 className="text-2xl font-black text-slate-900 mb-1">{submittedNominee?.fullName}</h3>
             <p className="text-primary-600 font-bold text-sm tracking-wide">{submittedNominee?.email}</p>
          </div>

          <div className="bg-primary-700 rounded-[2.5rem] p-8 mb-12 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-[40px]"></div>
            <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              Nomination ID
            </p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-4xl font-mono font-black text-white tracking-widest break-all">
                {trackingCode}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {event.whatsappGroupLink && (
              <a
                href={event.whatsappGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-5 bg-green-600 text-white rounded-[1.5rem] font-black text-lg hover:bg-green-700 transition-all shadow-xl shadow-green-600/20 active:scale-[0.98]"
              >
                <MessageCircle size={24} />
                Join Community
              </a>
            )}
            <button
              onClick={() => router.push(`/events/${event.eventCode || event.id}`)}
              className="w-full py-5 bg-slate-100 text-slate-900 rounded-[1.5rem] font-black text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              Back to Overview <ArrowRight size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          /* STEP 1: WELCOME INDUCTION */
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950"
          >
            {/* Background Image / Gradient */}
            <div className="absolute inset-0 z-0">
              {event.imageUrl || event.coverImage ? (
                <>
                  <Image 
                    src={event.imageUrl || event.coverImage} 
                    alt={event.title} 
                    fill 
                    className="object-cover scale-105 blur-[3px]"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
                </>
              ) : (
                <div className="absolute inset-0 bg-slate-900" />
              )}
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 text-[10px] font-black uppercase tracking-[0.4em] mb-4 backdrop-blur-md">
                   Nomination portal Open
                </div>
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.85] font-display text-white!">
                  {event.title}
                </h1>
                <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
                  {event.description?.substring(0, 180)}...
                </p>

                <div className="flex flex-wrap items-center justify-center gap-10 mb-16 opacity-50">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-white-500" size={20} />
                    <span className="text-sm font-bold tracking-tight">Active Phase</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="text-white-500" size={20} />
                    <span className="text-sm font-bold uppercase tracking-widest">{event.location || "Public"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6">
                  <button
                    onClick={() => setStep(2)}
                    className="group relative px-12 py-6 bg-white text-slate-950 rounded-[2rem] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10"
                  >
                    Start Your Nomination →
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Bottom Branding */}
            <div className="absolute bottom-10 left-0 right-0 z-10 flex justify-center opacity-40 grayscale">
               <img src="/easevote.svg" alt="Easevote" className="h-8" />
            </div>
          </motion.div>
        ) : (
          /* STEP 2: HIGH FIDELITY FORM (MIRRORS PREVIEW) */
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen py-10 px-4 sm:px-6"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold transition-all"
                >
                   ← Cancel
                </button>
              </div>

              {/* THE CARD - EXACTLY AS PREVIEWED */}
              <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col min-h-[800px]">
                
                 {/* Card Header with Event Image */}
                 <div
                   className="relative h-72 flex items-end p-10 md:p-14 bg-slate-900 overflow-hidden"
                   style={{
                     backgroundImage: event.imageUrl || event.coverImage ? `url(${event.imageUrl || event.coverImage})` : undefined,
                     backgroundSize: 'cover',
                     backgroundPosition: 'center'
                   }}
                 >
                   <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                   <div className="relative z-10 w-full">
                     <p className="text-white! text-[10px] font-black uppercase tracking-[0.3em] mb-3 drop-shadow-md">Nomination Portal</p>
                     <h3 className="text-4xl md:text-5xl font-black tracking-tight text-white! drop-shadow-lg font-display">{event.title}</h3>
                   </div>
                 </div>

                 {/* The Form Content */}
                 <form onSubmit={handleSubmit(onSubmit)} className="p-10 md:p-14 md:px-20 space-y-12">
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                     
                     {/* 2. Personal Info - Row 1 */}
                     <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Nominee Full Name *</label>
                        <input
                           {...register("fullName", { required: true })}
                           placeholder="Full legal name of the candidate"
                           className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 text-base focus:ring-4 focus:ring-primary-50/50 focus:border-primary-600 outline-none transition-all font-medium"
                        />
                        {errors.fullName && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest pl-1">Required</p>}
                     </div>

                     <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Nominee Email Address *</label>
                        <input
                           type="email"
                           {...register("email", { required: true })}
                           placeholder="candidate@email.com"
                           className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 text-base focus:ring-4 focus:ring-primary-50/50 focus:border-primary-600 outline-none transition-all font-medium"
                        />
                        {errors.email && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest pl-1">Required</p>}
                     </div>

                     {/* 2. Personal Info - Row 2 */}
                     <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Nominee Phone Number *</label>
                        <input
                           type="tel"
                           {...register("phone", { required: true })}
                           placeholder="+233..."
                           className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 text-base focus:ring-4 focus:ring-primary-50/50 focus:border-primary-600 outline-none transition-all font-medium"
                        />
                        {errors.phone && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest pl-1">Required</p>}
                     </div>

                     {/* 1. Category Selection */}
                     <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Nomination Category *</label>
                        <div className="relative">
                           <select
                              {...register("categoryId", { required: true })}
                              className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 text-base focus:ring-4 focus:ring-primary-50/50 focus:border-primary-600 outline-none transition-all appearance-none cursor-pointer font-medium"
                           >
                              <option value="">Select a category...</option>
                              {(event.categories || []).map((cat: any) => (
                                <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</option>
                              ))}
                           </select>
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                              <ChevronDown size={20} />
                           </div>
                        </div>
                        {errors.categoryId && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest pl-1 text-red-500">Required</p>}
                     </div>

                     {/* 3. Photo & Bio - Full Width */}
                     <div className="md:col-span-2 space-y-3" id="photo-field">
                        <label className="text-sm font-bold text-slate-700">Profile Photo *</label>
                        <div className="relative group">
                           <input
                             type="file"
                             accept="image/*"
                             onChange={handleFileUpload}
                             className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                           />
                           {photoUrl ? (
                             <div className="relative h-64 w-full rounded-2xl overflow-hidden group shadow-xl">
                               <Image src={photoUrl} alt="Nominee" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                               <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <p className="px-6 py-2 bg-white text-slate-950 rounded-full font-bold shadow-xl">Change Photo</p>
                               </div>
                             </div>
                           ) : (
                             <div className={clsx(
                               "h-48 w-full border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center transition-all bg-slate-50 group-hover:border-primary-600 group-hover:bg-primary-50/10",
                               isUploading ? "animate-pulse" : ""
                             )}>
                               {isUploading ? (
                                 <Loader2 className="animate-spin text-primary-500 mb-2" size={32} />
                               ) : (
                                 <UploadCloud className="text-slate-400 mb-2 group-hover:scale-110 transition-transform" size={36} />
                               )}
                               <p className="text-sm font-bold text-slate-900">
                                 {isUploading ? "Uploading Photo..." : "Upload Professional Photo"}
                               </p>
                               <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">5MB MAX (JPG, PNG)</p>
                             </div>
                           )}
                        </div>
                     </div>

                     <div className="md:col-span-2 space-y-3">
                        <label className="text-sm font-bold text-slate-700">Bio / Achievement Story *</label>
                        <textarea
                           {...register("bio", { required: true })}
                           rows={5}
                           placeholder="Tell us about yourself and why you should be nominated..."
                           className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 text-base focus:ring-4 focus:ring-primary-50/50 focus:border-primary-600 outline-none transition-all resize-none font-medium"
                        />
                        {errors.bio && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest pl-1">Biography is required</p>}
                     </div>

                     {/* 4. Custom Questions */}
                     {customFieldsConfig.length > 0 && (
                       <div className="md:col-span-2 space-y-10 pt-6 border-t border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Additional Requirements</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                             {customFieldsConfig.map((field: any, idx: number) => (
                               <div key={idx} className={clsx("space-y-3", (field.type === "textarea" || field.type === "TEXTAREA") ? "md:col-span-2" : "")}>
                                 <label className="text-sm font-bold text-slate-700">
                                   {field.question} {field.required && <span className="text-primary-600">*</span>}
                                 </label>
                                 {field.type === "textarea" ? (
                                   <textarea
                                     {...register(field.question, { required: field.required })}
                                     rows={3}
                                     className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-4 focus:ring-primary-50/50 focus:border-primary-600 outline-none transition-all resize-none font-medium"
                                   />
                                 ) : (
                                   <input
                                     {...register(field.question, { required: field.required })}
                                     className="w-full px-4 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-4 focus:ring-primary-50/50 focus:border-primary-600 outline-none transition-all font-medium"
                                   />
                                 )}
                                 {errors[field.question] && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest pl-1">Field required</p>}
                               </div>
                             ))}
                          </div>
                       </div>
                     )}
                   </div>

                   {/* Footer Actions */}
                   <div className="pt-12 space-y-10">
                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                        <ShieldCheck className="text-primary-600 mt-0.5" size={24} />
                        <div>
                          <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1 leading-none">Security Guaranteed</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                            By submitting this application, you certify that all information is accurate. Easevote protects your data according to our platform privacy policies.
                          </p>
                        </div>
                     </div>

                     <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-6 bg-primary-700 text-white rounded-[2rem] font-black text-xl hover:bg-primary-800 transition-all shadow-2xl shadow-primary-700/30 active:scale-[0.98] disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center gap-3">
                            <Loader2 className="animate-spin" size={24} />
                            Processing Application...
                          </div>
                        ) : (
                          "Complete Nomination"
                        )}
                      </button>

                      {/* OFFICIAL BRANDING FOOTER (MATCHES PREVIEW) */}
                      <div className="pt-20 pb-6 flex flex-col items-center gap-3 border-t border-slate-50 mt-16">
                        <div className="flex items-center gap-2 opacity-40">
                          <img src="/easevote.svg" alt="Easevote Logo" className="w-6 h-6 object-contain" />
                          <span className="text-xs font-bold text-slate-900 tracking-tight">EASEVOTE</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Powered by Easevote</p>
                          <a 
                            href="https://www.easevotegh.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-medium text-primary-600 hover:underline"
                          >
                            www.easevotegh.com
                          </a>
                        </div>
                      </div>
                   </div>
                 </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;500;600;700;800;900&display=swap');
        .font-display { font-family: 'Outfit', sans-serif !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
