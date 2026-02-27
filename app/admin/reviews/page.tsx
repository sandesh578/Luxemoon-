import { prisma } from '@/lib/prisma';
import AdminReviewsClient from './AdminReviewsClient';

export const dynamic = 'force-dynamic';

export default async function AdminReviews() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { id: true, name: true } } }
  });

  // Serialize dates for client component
  const serialized = reviews.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return <AdminReviewsClient reviews={serialized} />;
}