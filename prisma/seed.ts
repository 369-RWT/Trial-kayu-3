import { PrismaClient } from '@prisma/client';

// Inline calculator to avoid module resolution issues
const LOG_BASIS = 785;
const DIVISOR = 1_000_000;

function calculateLogValuation(circumference: number, length: number, quantity: number, marketPrice: number) {
    const diameter = circumference / 4;
    const rawVolume = Math.pow(diameter, 2) * length * LOG_BASIS * quantity;
    const volumeFinal = Math.floor(rawVolume / DIVISOR);
    const totalPrice = volumeFinal * marketPrice;
    return { diameter, rawVolume, volumeFinal, totalPrice };
}

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Al Fath Kayu - Seed Script');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Replicating Row 1 of Production Spreadsheet\n');

    // Clear existing data
    await prisma.log.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.woodType.deleteMany();

    // Step 1: Create Master Data
    const supplier = await prisma.supplier.create({
        data: { code: 'S001', name: 'Mukit' }
    });
    console.log(`✅ Supplier Created: ${supplier.name} (${supplier.code})`);

    const woodType = await prisma.woodType.create({
        data: { name: 'Laut' }
    });
    console.log(`✅ Wood Type Created: ${woodType.name}\n`);

    // Step 2: Test Calculation (Row 1 Data)
    const testData = {
        circumference: 87,  // cm (Lingkar)
        length: 300,        // cm (Panjang)
        quantity: 2,        // Jumlah Log
        marketPrice: 1300   // Harga Pasar
    };

    console.log('📊 Input Data (Row 1):');
    console.log(`   Lingkar: ${testData.circumference} cm`);
    console.log(`   Panjang: ${testData.length} cm`);
    console.log(`   Jumlah: ${testData.quantity}`);
    console.log(`   Harga Pasar: ${testData.marketPrice}\n`);

    const result = calculateLogValuation(
        testData.circumference,
        testData.length,
        testData.quantity,
        testData.marketPrice
    );

    console.log('🧮 Calculation Steps:');
    console.log(`   Diameter = ${testData.circumference} / 4 = ${result.diameter}`);
    console.log(`   Raw = ${result.diameter}² × ${testData.length} × ${LOG_BASIS} × ${testData.quantity}`);
    console.log(`   Raw Volume: ${result.rawVolume.toLocaleString()}`);
    console.log(`   Final = floor(${result.rawVolume.toLocaleString()} / ${DIVISOR.toLocaleString()})`);
    console.log(`   Volume Final: ${result.volumeFinal}`);
    console.log(`   Total Price: ${result.volumeFinal} × ${testData.marketPrice} = ${result.totalPrice.toLocaleString()}\n`);

    // Step 3: Save to Database
    const log = await prisma.log.create({
        data: {
            tagId: `LOG-ROW1-${Date.now()}`,
            circumference: testData.circumference,
            length: testData.length,
            quantity: testData.quantity,
            remainingQuantity: testData.quantity, // [NEW] Initialize with original quantity
            diameter: result.diameter,
            volumeRaw: result.rawVolume,
            volumeFinal: result.volumeFinal,
            calculationFactor: LOG_BASIS,
            marketPricePerUnit: testData.marketPrice,
            totalPurchasePrice: result.totalPrice,
            supplierId: supplier.id,
            woodTypeId: woodType.id,
        },
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 VERIFICATION RESULTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Raw Volume:   ${result.rawVolume.toLocaleString()} (Expected: 222,812,437.5)`);
    console.log(`   Volume Final: ${result.volumeFinal} (Expected: 222)`);
    console.log(`   Total Price:  ${result.totalPrice.toLocaleString()} (Expected: 288,600)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const rawMatch = result.rawVolume === 222812437.5;
    const finalMatch = result.volumeFinal === 222;
    const priceMatch = result.totalPrice === 288600;

    if (rawMatch && finalMatch && priceMatch) {
        console.log('✅ ALL VALUES MATCH SPREADSHEET!\n');
    } else {
        console.log('❌ MISMATCH DETECTED:');
        if (!rawMatch) console.log(`   Raw: Got ${result.rawVolume}, Expected 222812437.5`);
        if (!finalMatch) console.log(`   Final: Got ${result.volumeFinal}, Expected 222`);
        if (!priceMatch) console.log(`   Price: Got ${result.totalPrice}, Expected 288600`);
        console.log('');
    }

    console.log(`🎉 Log saved to database with ID: ${log.id}`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
