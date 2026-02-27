import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const catRes = await prisma.category.upsert({
        where: { slug: 'nanoplastia-collection' },
        update: {},
        create: {
            name: 'Nanoplastia Collection',
            slug: 'nanoplastia-collection',
            description: 'Professional glass hair treatment at home.',
        }
    });

    // 1. Anti Hair Fall Shampoo
    await prisma.product.updateMany({
        where: { slug: 'anti-hair-fall-shampoo' },
        data: {
            marketingDescription: '<p>Experience the ultimate defense against hair thinning with our <strong>Premium Korean Anti-Hair Fall Shampoo</strong>. Formulated with a potent blend of Biotin, Keratin, and traditional botanical extracts, it stimulates the scalp, fortifies roots, and dramatically reduces hair fall while delivering a luxurious, salon-quality cleanse.</p>',
            ingredients: 'Water, Sodium Laureth Sulfate, Cocamidopropyl Betaine, Biotin, Hydrolyzed Keratin, Panax Ginseng Root Extract, Camellia Sinensis Leaf Extract, Panthenol, Niacinamide, Fragrance.',
            howToUse: '1. Wet hair thoroughly.\n2. Apply a generous amount to scalp and hair.\n3. Massage gently for 2-3 minutes to stimulate roots.\n4. Rinse completely with lukewarm water.',
            benefits: ['Reduces Hair Fall', 'Stimulates Growth', 'Fortifies Roots', 'Sulfate-Free Cleansing'],
            faqs: [
                { q: "Is it safe for color-treated hair?", a: "Yes, our gentle formula preserves color vibrancy." },
                { q: "How soon will I see results?", a: "Most users notice reduced hair fall within 3-4 weeks of regular use." }
            ]
        }
    });

    // 2. Shining Silk Hair Mask
    await prisma.product.updateMany({
        where: { slug: 'shining-silk-hair-mask' },
        data: {
            marketingDescription: '<p>Transform dry, damaged strands into liquid silk. This intensive deep-conditioning mask repairs structural damage and seals the cuticle for unparalleled, reflective shine. Infused with Argan Oil and Silk Proteins, it restores elasticity and provides deep hydration without weighing your hair down.</p>',
            ingredients: 'Water, Cetearyl Alcohol, Dimethicone, Behentrimonium Chloride, Argania Spinosa Kernel Oil, Silk Amino Acids, Hydrolyzed collagen, Shea Butter, Fragrance.',
            howToUse: '1. After shampooing, squeeze out excess water.\n2. Apply evenly from mid-lengths to ends.\n3. Leave on for 5-10 minutes (for deep treatment, cover with a warm towel).\n4. Rinse thoroughly.',
            benefits: ['Intensive Hydration', 'Damage Repair', 'Liquid Silk Shine', 'Frizz Control'],
            faqs: [
                { q: "How often should I use it?", a: "We recommend using it 1-2 times a week for best results." }
            ]
        }
    });

    // 3. Soft & Silky Serum
    await prisma.product.updateMany({
        where: { slug: 'soft-silky-serum' },
        data: {
            marketingDescription: '<p>The finishing touch for flawless glass hair. This weightless, non-greasy serum instantly tames flyaways, seals split ends, and imparts a brilliant, lasting shine. Formulated with a proprietary blend of Korean botanicals, it protects against heat damage and environmental stressors.</p>',
            ingredients: 'Cyclopentasiloxane, Dimethiconol, Camellia Japonica Seed Oil, Macadamia Integrifolia Seed Oil, Tocopheryl Acetate, Fragrance.',
            howToUse: '1. Dispense 1-2 pumps into palms.\n2. Apply evenly to damp or dry hair, focusing on the ends.\n3. Style as usual. Can be used before heat styling for protection.',
            benefits: ['Heat Protection', 'Instant Shine', 'Split End Sealer', 'Lightweight Formula'],
            faqs: [
                { q: "Will it make my hair greasy?", a: "No, our ultra-lightweight formula absorbs instantly without leaving a sticky residue." }
            ]
        }
    });

    // 4. Add Nano Botox Combo
    const comboSlug = 'nano-botox-complete-therapy-kit';
    const existingCombo = await prisma.product.findUnique({ where: { slug: comboSlug } });

    if (!existingCombo) {
        // Find the standalone products to link as bundle items
        const shampoo = await prisma.product.findFirst({ where: { slug: 'anti-hair-fall-shampoo' } });
        const mask = await prisma.product.findFirst({ where: { slug: 'shining-silk-hair-mask' } });
        const serum = await prisma.product.findFirst({ where: { slug: 'soft-silky-serum' } });

        let bundleItemIds: string[] = [];
        if (shampoo && mask && serum) {
            bundleItemIds = [shampoo.id, mask.id, serum.id];
        }

        await prisma.product.create({
            data: {
                name: 'Nano Botox 4-in-1 Complete Hair Therapy Kit',
                slug: comboSlug,
                description: 'The ultimate Korean Nanoplastia aesthetic combo for transformative glass hair at home.',
                marketingDescription: '<p>Achieve salon-quality <strong>glass hair</strong> with our comprehensive 4-in-1 Nano Botox Kit. This curated regimen combines our bestselling Anti-Hair Fall Shampoo, Shining Silk Hair Mask, and Soft & Silky Serum to provide a complete transformation. Repair damage, halt hair fall, and seal in brilliant, reflective shine with incredible combo savings.</p>',
                priceInside: 4500,
                priceOutside: 4700,
                originalPrice: 6500, // Combo Savings
                images: [
                    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=2000&auto=format&fit=crop', // placeholder premium box
                    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=2574&auto=format&fit=crop'
                ],
                features: ['Complete 3-Step Regimen', 'Maximum Savings ($2000 Off)', 'Professional Nanoplastia Results', 'Gift-Ready Box'],
                benefits: ['Complete Transformation', 'Incredible Value', 'Synergistic Formula', 'Glass Hair Guarantee'],
                ingredients: 'See individual products for complete ingredient lists.',
                howToUse: 'Step 1: Cleanse with Anti-Hair Fall Shampoo.\nStep 2: Deep condition with Shining Silk Hair Mask (1-2x a week).\nStep 3: Finish and protect with Soft & Silky Serum.',
                faqs: [
                    { q: "Is this suitable for all hair types?", a: "Yes, the kit is designed to repair and enhance all hair textures." },
                    { q: "How much do I save with the combo?", a: "You save NPR 2,000 compared to buying the items individually!" }
                ],
                stock: 50,
                categoryId: catRes.id,
                isFeatured: true, // Highlight badge
                isNew: true,
                isBundle: true,
                bundleItemIds: bundleItemIds,
            }
        });
        console.log('Created combo product');
    } else {
        console.log('Combo product already exists');
    }

    console.log('Premium descriptions and combo successfully seeded!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
