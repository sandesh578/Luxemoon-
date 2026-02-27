import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CATEGORIES = [
  { name: 'Shampoo', slug: 'shampoo', description: 'Deep cleansing and nourishing formulas.' },
  { name: 'Treatment', slug: 'treatment', description: 'Advanced repair for damaged hair.' },
  { name: 'Serum', slug: 'serum', description: 'Lightweight protection and shine.' },
  { name: 'Kits', slug: 'kits', description: 'Complete hair transformation sets.' },
];

const INITIAL_PRODUCTS = [
  {
    slug: 'nano-botox-shampoo',
    name: 'Nano Botox Biotin + Keratin Shampoo',
    description: 'A revolutionary Korean formula designed to restore damaged hair. Enriched with Biotin and Keratin, this pH-balanced shampoo strengthens roots and adds a glass-like shine.',
    priceInside: 1800,
    priceOutside: 1950,
    originalPrice: 2200,
    categorySlug: 'shampoo',
    images: ['https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=800&auto=format&fit=crop'],
    features: ['Sulfate Free', 'Paraben Free', 'pH Balanced 5.5'],
    stock: 50,
    benefits: ['Strengthens roots', 'Adds shine', 'Restores elasticity'],
  },
  {
    slug: 'shining-silk-hair-mask',
    name: 'Shining Silk Hair Mask 4-in-1',
    description: 'Deep conditioning treatment that works in minutes. The 4-in-1 formula hydrates, repairs, smoothes, and protects against environmental damage.',
    priceInside: 2500,
    priceOutside: 2650,
    categorySlug: 'treatment',
    images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop'],
    features: ['Deep Hydration', 'Anti-Frizz', 'Korean Silk Protein'],
    stock: 30,
    benefits: ['Hydrates', 'Repairs damage', 'Protects'],
  },
];

async function main() {
  console.log('Start seeding ...');

  // Clear existing
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.homepageContent.deleteMany();
  await prisma.notificationLog.deleteMany();

  // 1. Categories
  const createdCategories: any = {};
  for (const c of CATEGORIES) {
    const cat = await prisma.category.create({ data: c });
    createdCategories[c.slug] = cat.id;
  }

  // 2. Products
  for (const p of INITIAL_PRODUCTS) {
    const { categorySlug, ...rest } = p;
    await prisma.product.create({
      data: {
        ...rest,
        categoryId: createdCategories[categorySlug],
      },
    });
  }

  // 3. Homepage Content
  await prisma.homepageContent.create({
    data: {
      heroSlides: [
        {
          image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop',
          title: 'Premium Korean Haircare',
          subtitle: 'Rooted in Korea. Created for the World.',
          ctaText: 'Shop Now',
          ctaLink: '/shop',
        }
      ],
      noticeBarText: 'Free Delivery on orders above NPR 5000!',
      noticeBarEnabled: true,
    }
  });

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
