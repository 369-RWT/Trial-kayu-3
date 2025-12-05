import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
    {
        name: 'Horizontal Beam A',
        sku: 'HB-A',
        standardVolume: 20, // Points per piece
    },
    {
        name: 'Balok Struktural',
        sku: 'BS-01',
        standardVolume: 50, // Points per piece
    },
    {
        name: 'Papan Cor',
        sku: 'PC-01',
        standardVolume: 5, // Points per piece
    },
];

async function main() {
    console.log('🏭 Seeding Product Catalog...\n');

    for (const product of products) {
        const result = await prisma.productType.upsert({
            where: { name: product.name },
            update: {
                sku: product.sku,
                standardVolume: product.standardVolume,
            },
            create: {
                name: product.name,
                sku: product.sku,
                standardVolume: product.standardVolume,
                stockCount: 0,
            },
        });

        console.log(`✅ ${result.name} (${result.sku}) - ${result.standardVolume} Points/piece`);
    }

    console.log('\n🎉 Product catalog seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
