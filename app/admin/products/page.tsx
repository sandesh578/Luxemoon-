import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Plus, Search, Star, Sparkles } from 'lucide-react';
import { OptimizedImage } from '@/components/OptimizedImage';

export const dynamic = 'force-dynamic';

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ search?: string; page?: string; category?: string }> }) {
  const params = await searchParams;
  const search = params.search || '';
  const page = parseInt(params.page || '1');
  const category = params.category || '';
  const pageSize = 20;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (category) where.categoryId = category;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        images: true,
        isFeatured: true,
        isNew: true,
        stock: true,
        priceInside: true,
        isActive: true,
        isArchived: true,
        isDraft: true,
        category: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-serif font-bold text-stone-900">Products</h1>
        <Link href="/admin/products/new" className="px-4 py-2 bg-stone-900 text-white text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-stone-800">
          <Plus className="w-4 h-4" /> New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 mb-6 p-4">
        <form className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input name="search" defaultValue={search} placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-lg" />
          </div>
          <select name="category" defaultValue={category} className="p-2 text-sm border border-stone-200 rounded-lg">
            <option value="">All Categories</option>
            {['Shampoo', 'Treatment', 'Serum', 'Kits', 'Accessories', 'Conditioner', 'Hair Oil', 'Hair Mask'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button className="px-4 py-2 bg-stone-100 text-sm font-bold rounded-lg">Filter</button>
        </form>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(product => (
          <Link key={product.id} href={`/admin/products/${product.id}`}
            className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow group">
            <div className="relative aspect-square bg-stone-100">
              {product.images[0] && (
                <OptimizedImage
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="w-full h-full object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              )}
              <div className="absolute top-2 left-2 flex gap-1">
                {product.isFeatured && (
                  <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Star className="w-3 h-3" /> Featured
                  </span>
                )}
                {product.isNew && (
                  <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" /> New
                  </span>
                )}
              </div>
              {product.stock <= 0 && (
                <div className="absolute top-2 right-2 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  Out of Stock
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-bold text-stone-900 text-sm truncate">{product.name}</h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-amber-700">NPR {product.priceInside.toLocaleString()}</span>
                <span className="text-xs text-stone-400">{product.stock} in stock</span>
              </div>
              {product.category?.name && (
                <span className="inline-block mt-1 text-[10px] font-bold bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{product.category.name}</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-stone-400">No products found</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && <Link href={`/admin/products?page=${page - 1}&search=${search}&category=${category}`} className="px-3 py-1 bg-stone-100 rounded-lg text-sm">Previous</Link>}
          <span className="text-sm text-stone-500">Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={`/admin/products?page=${page + 1}&search=${search}&category=${category}`} className="px-3 py-1 bg-stone-100 rounded-lg text-sm">Next</Link>}
        </div>
      )}
    </div>
  );
}
