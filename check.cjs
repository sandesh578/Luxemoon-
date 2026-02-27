const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.findMany({
    select: { slug: true, features: true, benefits: true }
}).then(p => {
    p.forEach(item => {
        const fString = JSON.stringify(item.features);
        const bString = JSON.stringify(item.benefits);
        if (fString.includes('<img') || bString.includes('<img') || fString.includes('http') || bString.includes('http')) {
            console.log("FOUND WEIRD CONTENT IN:", item.slug, fString, bString);
        }
    });
}).finally(() => prisma.$disconnect());
