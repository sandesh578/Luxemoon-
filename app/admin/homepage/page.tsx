'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X, MoveUp, MoveDown, Save, Megaphone, Monitor, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getHomepageContent, updateHomepageContent } from '../actions';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface HeroSlide {
    image: string;
    title: string;
    subtitle: string;
    link: string;
    buttonText: string;
}

interface Banner {
    image: string;
    link: string;
    title?: string;
}

export default function HomepageManager() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [promotionalImages, setPromotionalImages] = useState<string[]>([]);
    const [noticeBar, setNoticeBar] = useState({ text: '', enabled: false });

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const data = await getHomepageContent();
            if (data) {
                setHeroSlides((data.heroSlides as unknown as HeroSlide[]) || []);
                setBanners((data.banners as unknown as Banner[]) || []);
                setPromotionalImages((data.promotionalImages as string[]) || []);
                setNoticeBar({
                    text: data.noticeBarText || '',
                    enabled: data.noticeBarEnabled || false,
                });
            }
        } catch (e) {
            toast.error('Failed to load homepage content');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const res = await updateHomepageContent({
            heroSlides,
            banners,
            promotionalImages,
            noticeBarText: noticeBar.text,
            noticeBarEnabled: noticeBar.enabled,
        });
        if (res.success) {
            toast.success('Homepage updated!');
        } else {
            toast.error(res.error || 'Failed to update');
        }
        setSaving(false);
    };

    // Hero Slide Helpers
    const addHero = () => setHeroSlides([...heroSlides, { image: '', title: '', subtitle: '', link: '', buttonText: 'Shop Now' }]);
    const removeHero = (i: number) => setHeroSlides(heroSlides.filter((_, idx) => idx !== i));
    const updateHero = (i: number, fields: Partial<HeroSlide>) => {
        const next = [...heroSlides];
        next[i] = { ...next[i], ...fields };
        setHeroSlides(next);
    };
    const moveHero = (i: number, dir: 'up' | 'down') => {
        const next = [...heroSlides];
        const target = dir === 'up' ? i - 1 : i + 1;
        if (target < 0 || target >= next.length) return;
        [next[i], next[target]] = [next[target], next[i]];
        setHeroSlides(next);
    };

    // Banner Helpers
    const addBanner = () => setBanners([...banners, { image: '', link: '', title: '' }]);
    const removeBanner = (i: number) => setBanners(banners.filter((_, idx) => idx !== i));
    const updateBanner = (i: number, fields: Partial<Banner>) => {
        const next = [...banners];
        next[i] = { ...next[i], ...fields };
        setBanners(next);
    };

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading...</div>;

    return (
        <div className="max-w-5xl space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-stone-900">Homepage Content</h1>
                    <p className="text-stone-500">Manage hero slides, banners, and promotional notice bar.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-stone-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-800 disabled:opacity-50 transition-all sticky top-8 z-10 shadow-lg"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save All Changes
                </button>
            </div>

            {/* Notice Bar */}
            <Card title="Notice Bar" icon={<Megaphone className="text-amber-600" />}>
                <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={noticeBar.enabled}
                            onChange={e => setNoticeBar({ ...noticeBar, enabled: e.target.checked })}
                            className="rounded text-amber-600"
                        />
                        <span className="font-bold text-stone-700">Enable Notice Bar</span>
                    </label>
                </div>
                <input
                    placeholder="Enter notice text (e.g. Free Delivery on orders above NPR 5000!)"
                    className="w-full p-2.5 border rounded-lg bg-stone-50"
                    value={noticeBar.text}
                    onChange={e => setNoticeBar({ ...noticeBar, text: e.target.value })}
                />
            </Card>

            {/* Hero Slides */}
            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                        <Monitor className="text-stone-400 w-5 h-5" />
                        Hero Carousel
                    </h2>
                    <button
                        onClick={addHero}
                        className="text-amber-700 font-bold text-sm bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                        + Add Slide
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {heroSlides.map((slide, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative group">
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button onClick={() => moveHero(i, 'up')} className="p-1.5 text-stone-400 hover:text-stone-900"><MoveUp className="w-4 h-4" /></button>
                                <button onClick={() => moveHero(i, 'down')} className="p-1.5 text-stone-400 hover:text-stone-900"><MoveDown className="w-4 h-4" /></button>
                                <button onClick={() => removeHero(i)} className="p-1.5 text-stone-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Slide Image</label>
                                    <ImageUpload images={slide.image ? [slide.image] : []} onChange={urls => updateHero(i, { image: urls[0] || '' })} maxImages={1} />
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Title</label>
                                        <input className="w-full p-2 border rounded-lg text-lg font-serif" value={slide.title} onChange={e => updateHero(i, { title: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Subtitle</label>
                                        <textarea className="w-full p-2 border rounded-lg text-sm" rows={2} value={slide.subtitle} onChange={e => updateHero(i, { subtitle: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Button Text</label>
                                            <input className="w-full p-2 border rounded-lg text-sm" value={slide.buttonText} onChange={e => updateHero(i, { buttonText: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Link URL</label>
                                            <input className="w-full p-2 border rounded-lg text-sm" value={slide.link} onChange={e => updateHero(i, { link: e.target.value })} placeholder="/shop" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {heroSlides.length === 0 && <div className="p-12 text-center border-2 border-dashed rounded-2xl text-stone-400">No slides added. Click Add Slide to begin.</div>}
                </div>
            </section>

            {/* Side Banners */}
            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                        <ImageIcon className="text-stone-400 w-5 h-5" />
                        Promo Banners
                    </h2>
                    <button
                        onClick={addBanner}
                        className="text-amber-700 font-bold text-sm bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                        + Add Banner
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {banners.map((banner, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative">
                            <button onClick={() => removeBanner(i)} className="absolute top-4 right-4 text-stone-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                            <div className="space-y-4">
                                <ImageUpload images={banner.image ? [banner.image] : []} onChange={urls => updateBanner(i, { image: urls[0] || '' })} maxImages={1} />
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Link Title (Optional)</label>
                                        <input className="w-full p-2 border rounded-lg text-sm" value={banner.title || ''} onChange={e => updateBanner(i, { title: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Target Link</label>
                                        <input className="w-full p-2 border rounded-lg text-sm" value={banner.link} onChange={e => updateBanner(i, { link: e.target.value })} placeholder="/category/shampoo" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {banners.length === 0 && <div className="md:col-span-2 p-12 text-center border-2 border-dashed rounded-2xl text-stone-400">No banners added.</div>}
                </div>
            </section>

            {/* Promotional Images */}
            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                        <ImageIcon className="text-stone-400 w-5 h-5" />
                        Brand Story Image
                    </h2>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative">
                    <p className="text-sm text-stone-500 mb-4">This image appears in the "Our Heritage" / "Brand Story" section on the homepage.</p>
                    <ImageUpload images={promotionalImages} onChange={setPromotionalImages} maxImages={1} />
                </div>
            </section>
        </div>
    );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h2 className="text-xl font-serif font-bold text-stone-900 mb-6 flex items-center gap-2">
                {icon}
                {title}
            </h2>
            {children}
        </div>
    );
}
