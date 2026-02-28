import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRODUCT_SLUGS = [
  'anti-hair-fall-shampoo',
  'shining-silk-hair-mask',
  'soft-silky-serum',
] as const;

async function main() {
  console.log('Seeding LuxeMoon core 3-product catalog...');

  const category = await prisma.category.upsert({
    where: { slug: 'nanoplastia-collection' },
    update: {
      name: 'Nano Botox 4-in-1',
      description: 'Complete haircare system: Shampoo + Hair Mask + Hair Serum.',
      isActive: true,
      isArchived: false,
      deletedAt: null,
    },
    create: {
      name: 'Nano Botox 4-in-1',
      slug: 'nanoplastia-collection',
      description: 'Complete haircare system: Shampoo + Hair Mask + Hair Serum.',
      isActive: true,
      isArchived: false,
    },
  });

  const products = [
    {
      slug: 'anti-hair-fall-shampoo',
      name: 'LuxeMoon Nano Botox 4-in-1 Anti-Hair Fall Shampoo',
      description:
        'Gently cleanses scalp and helps reduce hair fall caused by breakage.',
      marketingDescription:
        '<p><strong>Anti-Hair Fall Shampoo</strong> is step 1 of the LuxeMoon Nano Botox 4-in-1 system. It removes buildup without over-drying and helps strengthen roots for healthier-looking hair.</p>',
      ingredients:
        'Aqua, Mild Cleansing Base, Biotin, Hydrolyzed Keratin, Panthenol, Botanical Extract Blend.',
      howToUse:
        'Use daily or on alternate days. Apply to wet scalp and hair, massage gently, then rinse well.',
      features: ['pH-Balanced Formula', 'Sulfate-Free', 'Paraben-Free', 'Silicone-Free'],
      benefits: ['Root strengthening', 'Scalp-friendly cleansing', 'Daily-use comfort'],
      tags: ['anti-hair-fall', 'shampoo', '4-in-1'],
      images: ['/products/shampoo.jpg', '/products/shampoo2.jpg'],
      priceInside: 1800,
      priceOutside: 1950,
      originalPrice: 2200,
      stock: 100,
      isFeatured: true,
      isNew: true,
      faqs: [
        { question: 'Is this for daily use?', answer: 'Yes. The formula is designed for regular use.' },
        { question: 'Who should use this?', answer: 'Anyone facing breakage-related hair fall and weak roots.' },
      ],
      seoTitle: 'Anti-Hair Fall Shampoo | LuxeMoon Nano Botox 4-in-1',
      seoDescription: 'Sulfate-free, pH-balanced shampoo that helps reduce breakage-related hair fall.',
    },
    {
      slug: 'shining-silk-hair-mask',
      name: 'LuxeMoon Nano Botox 4-in-1 Shining Silk Hair Mask',
      description:
        'Deeply nourishes dry, damaged hair for softer, smoother strands.',
      marketingDescription:
        '<p><strong>Shining Silk Hair Mask</strong> is step 2 of the LuxeMoon 3-step routine. It delivers intense nourishment to dry, rough, and damaged hair for a smooth salon-like finish.</p>',
      ingredients:
        'Aqua, Conditioning Base, Biotin, Keratin Complex, Argan Oil, Plant Lipids.',
      howToUse:
        'Apply 2-3 times weekly after shampoo. Leave for 5-10 minutes and rinse thoroughly.',
      features: ['pH-Balanced Formula', 'Sulfate-Free', 'Paraben-Free', 'Silicone-Free'],
      benefits: ['Deep nourishment', 'Frizz reduction', 'Improved softness and shine'],
      tags: ['hair-mask', 'repair', '4-in-1'],
      images: ['/products/mask.jpg'],
      priceInside: 2500,
      priceOutside: 2650,
      originalPrice: 3000,
      stock: 100,
      isFeatured: true,
      isNew: true,
      faqs: [
        { question: 'How often should I use this mask?', answer: 'Use 2-3 times per week after shampoo.' },
        { question: 'Does it help frizz?', answer: 'Yes, it helps smooth cuticles and control frizz.' },
      ],
      seoTitle: 'Shining Silk Hair Mask | LuxeMoon Nano Botox 4-in-1',
      seoDescription: 'Repair-focused hair mask for deep nourishment, softness, and frizz control.',
    },
    {
      slug: 'soft-silky-serum',
      name: 'LuxeMoon Nano Botox 4-in-1 Soft & Silky Hair Serum',
      description:
        'Controls frizz, adds shine, and improves manageability.',
      marketingDescription:
        '<p><strong>Soft &amp; Silky Hair Serum</strong> is step 3 of the LuxeMoon routine. Use on damp or dry hair for instant smoothness, better manageability, and a glossy finish.</p>',
      ingredients:
        'Silk-Feel Base, Biotin, Keratin Derivatives, Lightweight Conditioning Agents, Botanical Oils.',
      howToUse:
        'Apply a small amount on damp or dry hair, focusing on lengths and ends.',
      features: ['pH-Balanced Formula', 'Sulfate-Free', 'Paraben-Free', 'Silicone-Free'],
      benefits: ['Frizz control', 'Shine boost', 'Easy combing and styling'],
      tags: ['serum', 'frizz-control', '4-in-1'],
      images: ['/products/serum.jpg'],
      priceInside: 1400,
      priceOutside: 1550,
      originalPrice: 1800,
      stock: 100,
      isFeatured: true,
      isNew: true,
      faqs: [
        { question: 'Can I use this before styling?', answer: 'Yes, apply a small amount before or after styling.' },
        { question: 'Will it feel sticky?', answer: 'No. It is lightweight and non-greasy when used in small quantity.' },
      ],
      seoTitle: 'Soft & Silky Hair Serum | LuxeMoon Nano Botox 4-in-1',
      seoDescription: 'Lightweight serum for frizz control, shine, and daily manageability.',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        ...product,
        categoryId: category.id,
        isActive: true,
        isArchived: false,
        isDraft: false,
        deletedAt: null,
        discountPercent: 0,
        discountFixed: null,
      },
      create: {
        ...product,
        categoryId: category.id,
        priceOutside: product.priceOutside,
        isActive: true,
        isArchived: false,
        isDraft: false,
      },
    });
  }

  await prisma.product.updateMany({
    where: { slug: { notIn: [...PRODUCT_SLUGS] } },
    data: {
      isActive: false,
      isArchived: true,
      isFeatured: false,
      isNew: false,
    },
  });

  await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: {
      storeName: 'LuxeMoon',
      bannerText: 'Nano Botox Biotin + Keratin 4-in-1',
      contactPhone: '+977 9800000000',
      contactEmail: 'hello@luxemoon.com.np',
      contactAddress: 'Kathmandu, Nepal',
      deliveryChargeInside: 0,
      deliveryChargeOutside: 150,
      freeDeliveryThreshold: 5000,
      estimatedDeliveryInside: '1-2 days',
      estimatedDeliveryOutside: '3-5 days',
      metaTitle: 'LuxeMoon Nano Botox 4-in-1 | Official Haircare Store Nepal',
      metaDescription:
        'Official LuxeMoon Nepal store for Nano Botox Biotin + Keratin 4-in-1 haircare: Anti-Hair Fall Shampoo, Shining Silk Hair Mask, and Soft & Silky Hair Serum.',
      footerContent:
        '3-step haircare system built for stronger roots, deep nourishment, and smooth frizz-controlled shine.',
      festiveSaleEnabled: true,
    },
    create: {
      id: 1,
      storeName: 'LuxeMoon',
      bannerText: 'Nano Botox Biotin + Keratin 4-in-1',
      contactPhone: '+977 9800000000',
      contactEmail: 'hello@luxemoon.com.np',
      contactAddress: 'Kathmandu, Nepal',
      deliveryChargeInside: 0,
      deliveryChargeOutside: 150,
      freeDeliveryThreshold: 5000,
      codFee: 0,
      expressDeliveryEnabled: false,
      estimatedDeliveryInside: '1-2 days',
      estimatedDeliveryOutside: '3-5 days',
      globalDiscountPercent: 0,
      metaTitle: 'LuxeMoon Nano Botox 4-in-1 | Official Haircare Store Nepal',
      metaDescription:
        'Official LuxeMoon Nepal store for Nano Botox Biotin + Keratin 4-in-1 haircare: Anti-Hair Fall Shampoo, Shining Silk Hair Mask, and Soft & Silky Hair Serum.',
      footerContent:
        '3-step haircare system built for stronger roots, deep nourishment, and smooth frizz-controlled shine.',
      emailNotificationsEnabled: false,
      smsNotificationsEnabled: false,
      festiveSaleEnabled: true,
    },
  });

  await prisma.homepageContent.upsert({
    where: { id: 1 },
    update: {
      heroSlides: [
        {
          image: '/products/combo.png',
          title: 'Nano Botox 4-in-1',
          subtitle:
            'Shampoo + Hair Mask + Hair Serum. Build stronger, smoother, shinier hair in a complete 3-step routine.',
          link: '/shop',
          buttonText: 'SHOP 3-STEP ROUTINE',
        },
      ],
      noticeBarText: 'Sulfate-Free | Paraben-Free | Silicone-Free',
      noticeBarEnabled: true,
      banners: [
        {
          image: '/products/shampoo.jpg',
          title: 'Anti-Hair Fall Shampoo',
          link: '/products/anti-hair-fall-shampoo',
        },
        {
          image: '/products/serum.jpg',
          title: 'Soft & Silky Hair Serum',
          link: '/products/soft-silky-serum',
        },
      ],
      promotionalImages: ['/products/mask.jpg'],
    },
    create: {
      id: 1,
      heroSlides: [
        {
          image: '/products/combo.png',
          title: 'Nano Botox 4-in-1',
          subtitle:
            'Shampoo + Hair Mask + Hair Serum. Build stronger, smoother, shinier hair in a complete 3-step routine.',
          link: '/shop',
          buttonText: 'SHOP 3-STEP ROUTINE',
        },
      ],
      noticeBarText: 'Sulfate-Free | Paraben-Free | Silicone-Free',
      noticeBarEnabled: true,
      banners: [
        {
          image: '/products/shampoo.jpg',
          title: 'Anti-Hair Fall Shampoo',
          link: '/products/anti-hair-fall-shampoo',
        },
        {
          image: '/products/serum.jpg',
          title: 'Soft & Silky Hair Serum',
          link: '/products/soft-silky-serum',
        },
      ],
      promotionalImages: ['/products/mask.jpg'],
    },
  });

  console.log('LuxeMoon 3-product brand data seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
