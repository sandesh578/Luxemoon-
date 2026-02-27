import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ChevronRight } from 'lucide-react';

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const category = await prisma.category.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            description: true,
            image: true,
            products: {
                where: { isDeleted: false },
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    images: true,
                    priceInside: true,
                    originalPrice: true,
                    isFeatured: true,
                    stock: true,
                },
                orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
            },
        },
    });

    if (!category) notFound();

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            {/* Category Banner */}
            <section className="relative h-[40vh] flex items-center justify-center bg-stone-900 overflow-hidden">
                {category.image ? (
                    <Image
                        src={category.image}
                        fill
                        className="object-cover opacity-60"
                        alt={category.name}
                        sizes="100vw"
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-950 opacity-50" />
                )}
                <div className="absolute inset-0 bg-black/30" />

                <div className="relative z-10 text-center px-4 max-w-3xl space-y-4">
                    <nav className="flex items-center justify-center gap-2 text-stone-300 text-xs font-bold uppercase tracking-widest mb-6">
                        <Link href="/" className="hover:text-amber-500 transition-colors">Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/shop" className="hover:text-amber-500 transition-colors">Shop</Link>
                    </nav>
                    <h1 className="text-4xl md:text-6xl font-serif text-white">{category.name}</h1>
                    {category.description && (
                        <p className="text-stone-200 text-lg font-light max-w-xl mx-auto leading-relaxed">
                            {category.description}
                        </p>
                    )}
                </div>
            </section>

            {/* Product Grid */}
            <section className="max-w-7xl mx-auto px-4 py-20">
                <div className="flex justify-between items-center mb-12">
                    <h2 className="text-sm font-bold text-stone-400 uppercase tracking-[0.2em]">Showing {category.products.length} Products</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {category.products.map(product => (
                        <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            className="group cursor-pointer block"
                        >
                            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-stone-100 mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-500">
                                {product.images[0] && (
                                    <Image
                                        src={product.images[0]}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        alt={product.name}
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        loading="lazy"
                                    />
                                )}

                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                    {product.originalPrice && product.originalPrice > product.priceInside && (
                                        <span className="text-[10px] font-bold bg-amber-600 text-white px-3 py-1 rounded-full shadow-lg">
                                            OFFER
                                        </span>
                                    )}
                                </div>

                                {product.stock <= 0 && (
                                    <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center backdrop-blur-[2px]">
                                        <span className="bg-stone-900 border border-stone-800 text-white px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">Out of Stock</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1 px-2">
                                <h3 className="font-serif text-xl text-stone-900 group-hover:text-amber-700 transition-colors">
                                    {product.name}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-stone-900">NPR {product.priceInside.toLocaleString()}</span>
                                    {product.originalPrice && product.originalPrice > product.priceInside && (
                                        <span className="text-xs text-stone-400 line-through">NPR {product.originalPrice.toLocaleString()}</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {category.products.length === 0 && (
                    <div className="py-32 text-center space-y-4">
                        <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Star className="w-8 h-8 text-stone-200" />
                        </div>
                        <p className="text-stone-400 font-serif text-2xl">New arrivals coming soon to this collection.</p>
                        <Link href="/shop" className="inline-block text-amber-600 font-bold border-b-2 border-amber-600 pb-1">Browse All Products</Link>
                    </div>
                )}
            </section>
        </div>
    );
}
