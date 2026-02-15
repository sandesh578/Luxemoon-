import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const INITIAL_PRODUCTS = [
  {
    slug: 'nano-botox-shampoo',
    name: 'Nano Botox Biotin + Keratin Shampoo',
    description: 'A revolutionary Korean formula designed to restore damaged hair. Enriched with Biotin and Keratin, this pH-balanced shampoo strengthens roots and adds a glass-like shine.',
    priceInside: 1800,
    priceOutside: 1950,
    originalPrice: 2200,
    category: 'Shampoo',
    images: ['https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=800&auto=format&fit=crop'],
    features: ['Sulfate Free', 'Paraben Free', 'pH Balanced 5.5'],
    stock: 50,
  },
  {
    slug: 'shining-silk-hair-mask',
    name: 'Shining Silk Hair Mask 4-in-1',
    description: 'Deep conditioning treatment that works in minutes. The 4-in-1 formula hydrates, repairs, smoothes, and protects against environmental damage.',
    priceInside: 2500,
    priceOutside: 2650,
    category: 'Treatment',
    images: ['https://images.unsplash.com/photo-1556228720-1987594a8163?q=80&w=800&auto=format&fit=crop'],
    features: ['Deep Hydration', 'Anti-Frizz', 'Korean Silk Protein'],
    stock: 30,
  },
  {
    slug: 'soft-silky-serum',
    name: 'Soft and Silky Hair Serum',
    description: 'Lightweight, non-greasy serum that seals split ends and provides thermal protection. Perfect for daily styling in Nepal\'s humid climate.',
    priceInside: 1500,
    priceOutside: 1600,
    originalPrice: 1800,
    category: 'Serum',
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop'],
    features: ['Heat Protection', 'Instant Shine', 'Non-Sticky'],
    stock: 100,
  },
  {
    slug: 'complete-nanoplastia-kit',
    name: 'Complete Nanoplastia Kit',
    description: 'The ultimate salon-level experience at home. Includes Shampoo, Mask, and Serum for a complete hair transformation. Best value.',
    priceInside: 5200,
    priceOutside: 5500,
    originalPrice: 5800,
    category: 'Kits',
    images: ['https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=800&auto=format&fit=crop'],
    features: ['Complete Care', 'Value Pack', 'Premium Gift Box'],
    stock: 15,
  }
];

async function main() {
  console.log('Start seeding ...');
  
  // Clear existing products to prevent duplicates on re-seed
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.product.deleteMany();

  for (const p of INITIAL_PRODUCTS) {
    const product = await prisma.product.create({
      data: p,
    });
    console.log(`Created product with id: ${product.id}`);
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    (process as any).exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });