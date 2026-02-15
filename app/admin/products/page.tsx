import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Edit, Trash } from 'lucide-react';
import { deleteProduct } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminProducts() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-stone-900">Products</h1>
        <Link href="/admin/products/new" className="bg-stone-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-stone-800">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Price (Inside/Outside)</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Category</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {products.map(p => (
              <tr key={p.id}>
                <td className="p-4 font-bold">{p.name}</td>
                <td className="p-4">NPR {p.priceInside} / {p.priceOutside}</td>
                <td className="p-4">{p.stock}</td>
                <td className="p-4"><span className="px-2 py-1 bg-stone-100 rounded-md text-xs">{p.category}</span></td>
                <td className="p-4 flex gap-2">
                  <Link href={`/admin/products/${p.id}`} className="p-2 text-stone-600 hover:text-amber-700 bg-stone-50 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <form action={async () => {
                    'use server';
                    await deleteProduct(p.id);
                  }}>
                    <button className="p-2 text-red-600 hover:text-red-800 bg-red-50 rounded-lg">
                      <Trash className="w-4 h-4" />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
