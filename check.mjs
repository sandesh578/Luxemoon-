const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.findFirst({
    where: { slug: 'luxe-moon-nano-botox-biotin-keratin-nanoplastia' },
    select: { name: true, description: true, marketingDescription: true, howToUse: true, ingredients: true, images: true }
}).then(console.dir).finally(() => prisma.$disconnect());
