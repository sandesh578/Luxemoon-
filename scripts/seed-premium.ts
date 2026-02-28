import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Applying premium content to LuxeMoon 3-product catalog...');

  await prisma.product.updateMany({
    where: { slug: 'anti-hair-fall-shampoo' },
    data: {
      name: 'LuxeMoon Nano Botox 4-in-1 Anti-Hair Fall Shampoo',
      marketingDescription:
        '<p>Step 1 in the LuxeMoon 3-step system. Cleanses scalp and helps reduce hair fall caused by breakage.</p>',
      ingredients:
        'Aqua, Mild Cleansing Base, Biotin, Hydrolyzed Keratin, Panthenol, Botanical Extract Blend.',
      howToUse:
        'Use daily or on alternate days. Apply to wet scalp and hair, massage gently, then rinse well.',
      benefits: ['Root strengthening', 'Scalp-friendly cleansing', 'Daily-use comfort'],
      features: ['pH-Balanced Formula', 'Sulfate-Free', 'Paraben-Free', 'Silicone-Free'],
      images: ['/products/shampoo.jpg', '/products/shampoo2.jpg'],
    },
  });

  await prisma.product.updateMany({
    where: { slug: 'shining-silk-hair-mask' },
    data: {
      name: 'LuxeMoon Nano Botox 4-in-1 Shining Silk Hair Mask',
      marketingDescription:
        '<p>Step 2 in the LuxeMoon 3-step system. Deeply nourishes dry and damaged hair for smoothness and shine.</p>',
      ingredients: 'Aqua, Conditioning Base, Biotin, Keratin Complex, Argan Oil, Plant Lipids.',
      howToUse:
        'Apply 2-3 times weekly after shampoo. Leave for 5-10 minutes and rinse thoroughly.',
      benefits: ['Deep nourishment', 'Frizz reduction', 'Improved softness and shine'],
      features: ['pH-Balanced Formula', 'Sulfate-Free', 'Paraben-Free', 'Silicone-Free'],
      images: ['/products/mask.jpg'],
    },
  });

  await prisma.product.updateMany({
    where: { slug: 'soft-silky-serum' },
    data: {
      name: 'LuxeMoon Nano Botox 4-in-1 Soft & Silky Hair Serum',
      marketingDescription:
        '<p>Step 3 in the LuxeMoon 3-step system. Controls frizz, adds shine, and improves daily manageability.</p>',
      ingredients:
        'Silk-Feel Base, Biotin, Keratin Derivatives, Lightweight Conditioning Agents, Botanical Oils.',
      howToUse:
        'Apply a small amount on damp or dry hair, focusing on lengths and ends.',
      benefits: ['Frizz control', 'Shine boost', 'Easy combing and styling'],
      features: ['pH-Balanced Formula', 'Sulfate-Free', 'Paraben-Free', 'Silicone-Free'],
      images: ['/products/serum.jpg'],
    },
  });

  await prisma.product.updateMany({
    where: { slug: 'nano-botox-complete-therapy-kit' },
    data: {
      isActive: false,
      isArchived: true,
      isFeatured: false,
      isNew: false,
      deletedAt: new Date(),
    },
  });

  console.log('Premium catalog content updated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
