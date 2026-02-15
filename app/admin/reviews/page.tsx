import { prisma } from '@/lib/prisma';
import { Trash } from 'lucide-react';
import { deleteReview } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminReviews() {
  const reviews = await prisma.review.findMany({ 
    orderBy: { createdAt: 'desc' },
    include: { product: true }
  });

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-stone-900 mb-8">Customer Reviews</h1>
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Product</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Comment</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {reviews.map(r => (
              <tr key={r.id}>
                <td className="p-4 text-stone-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="p-4 font-bold">{r.userName}</td>
                <td className="p-4 text-xs">{r.product.name}</td>
                <td className="p-4">{r.rating} / 5</td>
                <td className="p-4 max-w-xs truncate">{r.comment}</td>
                <td className="p-4">
                  <form action={async () => {
                    'use server';
                    await deleteReview(r.id);
                  }}>
                    <button className="text-red-600 hover:text-red-800"><Trash className="w-4 h-4" /></button>
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