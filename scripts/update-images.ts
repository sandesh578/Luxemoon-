import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    await prisma.product.updateMany({
        where: { slug: 'anti-hair-fall-shampoo' },
        data: { images: ['/products/shampoo.jpg', '/products/shampoo2.jpg'] }
    });

    await prisma.product.updateMany({
        where: { slug: 'shining-silk-hair-mask' },
        data: { images: ['/products/mask.jpg'] }
    });

    await prisma.product.updateMany({
        where: { slug: 'soft-silky-serum' },
        data: { images: ['/products/serum.jpg'] }
    });

    await prisma.product.updateMany({
        where: { slug: 'nano-botox-complete-therapy-kit' },
        data: { images: ['/products/combo.png', '/products/shampoo.jpg', '/products/mask.jpg', '/products/serum.jpg'] }
    });

    console.log('Images updated!');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
