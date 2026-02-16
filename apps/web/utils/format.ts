/**
 * Formats a price string or number into Indian currency format (INR).
 * Use en-IN locale for Indian numbering system (e.g., 1,00,000).
 */
export function formatPrice(price: string | number | null | undefined): string {
    if (price === null || price === undefined || price === "0.00" || price === 0) {
        return "Free";
    }

    const numericPrice = typeof price === "string" ? parseFloat(price) : price;

    if (isNaN(numericPrice)) {
        return "Free";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0, // Usually whole numbers for big assets, adjust if needed
    }).format(numericPrice);
}
