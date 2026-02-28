'use client';

import React, { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { useI18n } from '@/components/Providers';

interface ContactConfig {
    contactPhone: string;
    contactEmail: string;
    contactAddress: string;
    whatsappNumber?: string | null;
}

const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().min(10, 'Telephone must be at least 10 numbers').max(15, 'Telephone is too long'),
    subject: z.enum(['Order Issue', 'Product Query', 'Collaboration', 'Other']),
    message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long')
});

type FormData = z.infer<typeof formSchema>;

export default function ContactClient({ config }: { config: ContactConfig }) {
    const { t } = useI18n();
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        subject: 'Product Query',
        message: ''
    });

    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const cleanWhatsAppUrl = config.whatsappNumber
        ? `https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(t('whatsapp.helloMessage'))}`
        : `https://wa.me/9779800000000?text=${encodeURIComponent(t('whatsapp.helloMessage'))}`;

    const validateField = (field: keyof FormData, value: string) => {
        try {
            if (field === 'subject') {
                // Enum naturally validates on submit
                return;
            }
            const schemaField = formSchema.shape[field];
            schemaField.parse(value);
            setErrors(prev => ({ ...prev, [field]: undefined }));
        } catch (error) {
            if (error instanceof z.ZodError) {
                setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormData]) {
            validateField(name as keyof FormData, value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            setErrors({});
            const validatedData = formSchema.parse(formData);

            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validatedData)
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Failed to submit message');
            }

            setIsSuccess(true);
            toast.success(t('contact.toastSent'));

        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: any = {};
                error.errors.forEach(err => {
                    if (err.path[0]) newErrors[err.path[0]] = err.message;
                });
                setErrors(newErrors);
                toast.error(t('contact.toastFixErrors'));
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error(t('contact.toastSomethingWrong'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50/50 pb-24">
            {/* Hero Header */}
            <section className="relative px-4 pt-20 pb-16 overflow-hidden flex flex-col items-center justify-center text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-[#F6EFE7] to-stone-50/50 -z-10" />
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out max-w-2xl mx-auto space-y-6">
                    <span className="text-amber-600 font-bold text-xs tracking-widest uppercase">{t('contact.heroTag')}</span>
                    <h1 className="font-serif text-5xl md:text-6xl font-bold text-[#5C3A21] leading-tight">{t('contact.heroTitle')}</h1>
                    <p className="text-stone-600 text-lg md:text-xl">
                        {t('contact.heroBody')}
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 mt-8">
                <div className="flex flex-col lg:flex-row gap-8 xl:gap-16">

                    {/* Form Side */}
                    <div className="flex-1 lg:max-w-2xl order-2 lg:order-1 animate-in fade-in slide-in-from-left-8 duration-1000 delay-150">
                        <div className="bg-white rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 p-8 md:p-12 overflow-hidden relative">

                            {/* Decorative top bar */}
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-200 via-[#C7782A] to-amber-200" />

                            {isSuccess ? (
                                <div className="flex flex-col items-center justify-center text-center py-16 space-y-6 animate-in zoom-in-95 duration-500">
                                    <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 className="w-12 h-12 text-[#C7782A]" />
                                    </div>
                                    <h3 className="font-serif text-3xl font-bold text-[#5C3A21]">{t('contact.messageReceived')}</h3>
                                    <p className="text-stone-600 text-lg max-w-sm mx-auto">
                                        {t('contact.messageReceivedBody')}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setIsSuccess(false);
                                            setFormData({ name: '', email: '', phone: '', subject: 'Product Query', message: '' });
                                        }}
                                        className="mt-8 px-8 py-3 bg-stone-100 text-stone-700 font-bold rounded-full hover:bg-stone-200 transition-colors"
                                    >
                                        {t('contact.sendAnother')}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <h2 className="font-serif text-3xl font-bold text-[#5C3A21] mb-8">{t('contact.sendMessage')}</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-[#5C3A21] uppercase tracking-widest">{t('contact.fullName')} *</label>
                                            <input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                onBlur={(e) => validateField('name', e.target.value)}
                                                className={`w-full bg-[#F6EFE7]/50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#C7782A]/50 transition-all ${errors.name ? 'ring-2 ring-red-400 bg-red-50' : ''}`}
                                                placeholder={t('contact.placeholderName')}
                                            />
                                            {errors.name && <span className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" />{errors.name}</span>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-[#5C3A21] uppercase tracking-widest">{t('contact.emailOptional')}</label>
                                            <input
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                onBlur={(e) => validateField('email', e.target.value)}
                                                className={`w-full bg-[#F6EFE7]/50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#C7782A]/50 transition-all ${errors.email ? 'ring-2 ring-red-400 bg-red-50' : ''}`}
                                                placeholder="hello@example.com"
                                            />
                                            {errors.email && <span className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" />{errors.email}</span>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-[#5C3A21] uppercase tracking-widest">{t('contact.phoneNumber')} *</label>
                                            <input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                onBlur={(e) => validateField('phone', e.target.value)}
                                                className={`w-full bg-[#F6EFE7]/50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#C7782A]/50 transition-all ${errors.phone ? 'ring-2 ring-red-400 bg-red-50' : ''}`}
                                                placeholder="+977 9800000000"
                                            />
                                            {errors.phone && <span className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" />{errors.phone}</span>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-[#5C3A21] uppercase tracking-widest">{t('contact.subject')} *</label>
                                            <select
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                className="w-full bg-[#F6EFE7]/50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#C7782A]/50 transition-all outline-none"
                                            >
                                                <option value="Product Query">{t('contact.subjectProductQuery')}</option>
                                                <option value="Order Issue">{t('contact.subjectOrderIssue')}</option>
                                                <option value="Collaboration">{t('contact.subjectCollaboration')}</option>
                                                <option value="Other">{t('contact.subjectOther')}</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <label className="block text-xs font-bold text-[#5C3A21] uppercase tracking-widest">{t('contact.yourMessage')} *</label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            onBlur={(e) => validateField('message', e.target.value)}
                                            rows={5}
                                            className={`w-full bg-[#F6EFE7]/50 border-none rounded-3xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#C7782A]/50 transition-all resize-none ${errors.message ? 'ring-2 ring-red-400 bg-red-50' : ''}`}
                                            placeholder={t('contact.placeholderMessage')}
                                        />
                                        {errors.message && <span className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" />{errors.message}</span>}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-[#5C3A21] text-white font-bold rounded-2xl hover:bg-[#462c19] disabled:opacity-70 transition-all shadow-xl shadow-[#5C3A21]/10 active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                {t('contact.sending').toUpperCase()}
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" /> {t('contact.sendMessageBtn').toUpperCase()}
                                            </>
                                        )}
                                    </button>
                                    <p className="text-center text-[10px] text-stone-400 uppercase tracking-wider font-bold mt-4">{t('contact.protectedBy')}</p>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Action Cards Side */}
                    <div className="flex-1 lg:w-96 order-1 lg:order-2 space-y-6 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
                        <h3 className="font-serif text-2xl font-bold text-[#5C3A21] mb-6 pt-2">{t('contact.directContact')}</h3>

                        <a href={`tel:${config.contactPhone.replace(/[\s-]/g, '')}`} className="group flex items-center gap-5 p-6 bg-white rounded-3xl border border-stone-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#C7782A]/30 transition-all duration-300 transform hover:-translate-y-1">
                            <div className="w-14 h-14 bg-[#F6EFE7] rounded-full flex items-center justify-center group-hover:bg-[#C7782A] group-hover:text-white transition-colors">
                                <Phone className="w-6 h-6 text-[#5C3A21] group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <h4 className="font-bold text-[#5C3A21] text-lg">{t('contact.callUs')}</h4>
                                <p className="text-sm text-stone-500 font-medium">{config.contactPhone}</p>
                            </div>
                        </a>

                        <a href={cleanWhatsAppUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-5 p-6 bg-white rounded-3xl border border-stone-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#C7782A]/30 transition-all duration-300 transform hover:-translate-y-1">
                            <div className="w-14 h-14 bg-[#F6EFE7] rounded-full flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                                <MessageCircle className="w-6 h-6 text-[#5C3A21] group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <h4 className="font-bold text-[#5C3A21] text-lg">{t('contact.whatsapp')}</h4>
                                <p className="text-sm text-stone-500 font-medium">{config.whatsappNumber || t('contact.messageDirectly')}</p>
                            </div>
                        </a>

                        <a href={`mailto:${config.contactEmail}`} className="group flex items-center gap-5 p-6 bg-white rounded-3xl border border-stone-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#C7782A]/30 transition-all duration-300 transform hover:-translate-y-1">
                            <div className="w-14 h-14 bg-[#F6EFE7] rounded-full flex items-center justify-center group-hover:bg-[#C7782A] group-hover:text-white transition-colors">
                                <Mail className="w-6 h-6 text-[#5C3A21] group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <h4 className="font-bold text-[#5C3A21] text-lg">{t('contact.emailDirectly')}</h4>
                                <p className="text-sm text-stone-500 font-medium">{config.contactEmail}</p>
                            </div>
                        </a>

                        <div className="flex flex-col p-6 bg-white rounded-3xl border border-stone-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all duration-300 group">
                            <a href="https://maps.google.com/?q=Luxe+Moon+Durbarmarg" target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 mb-5 cursor-pointer">
                                <div className="w-14 h-14 bg-[#F6EFE7] rounded-full flex items-center justify-center group-hover:bg-[#C7782A] group-hover:text-white transition-colors flex-shrink-0">
                                    <MapPin className="w-6 h-6 text-[#5C3A21] group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#5C3A21] text-lg hover:underline decoration-[#C7782A]">{t('contact.visitOffice')}</h4>
                                    <p className="text-sm text-stone-500 font-medium">{config.contactAddress}</p>
                                </div>
                            </a>
                            <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.227448554228!2d85.3168817!3d27.7099684!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb1907b0522dfb%3A0xc3b9eb227ebd1191!2sDurbar%20Marg%2C%20Kathmandu%2044600!5e0!3m2!1sen!2snp!4v1700000000000!5m2!1sen!2snp"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen={false}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Luxe Moon Office Location"
                                    className="absolute inset-0 grayscale contrast-125 opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
