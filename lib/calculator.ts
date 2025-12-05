// Al Fath Kayu - Business Logic Engine
// Formula matches Real Production Spreadsheet

export const LOG_BASIS = 785;
export const DIVISOR = 1000000; // The "1 Million" rule

export function calculateLogValuation(
    circumference: number, // cm
    length: number,        // cm
    quantity: number = 1,
    marketPrice: number    // "Harga Pasar"
) {
    const diameter = circumference / 4;

    // Formula: (D^2 * L * 785 * Qty)
    const rawVolume = (diameter * diameter) * length * LOG_BASIS * quantity;

    // The "Million Point" Rule
    const volumeFinal = Math.floor(rawVolume / DIVISOR);

    const totalPrice = volumeFinal * marketPrice;

    return { diameter, rawVolume, volumeFinal, totalPrice };
}
