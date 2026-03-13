/**
 * Payout Calculation Utility
 * 
 * Formula:
 * Sale Amount - GST (18%) - TCS (1%) - Platform Fee (15-20%) = Payout (Gross)
 * Handle TDS (10%) withheld on the payout itself.
 * 
 * Net Payout = Payout (Gross) - TDS
 */

export interface PayoutComponents {
    saleAmount: number;
    gst: number;
    tcs: number;
    platformFee: number;
    grossPayout: number;
    tds: number;
    netPayout: number;
}

export const DEFAULT_PLATFORM_FEE_PERCENT = 0.15; // 15%
export const GST_PERCENT = 0.18; // 18%
export const TCS_PERCENT = 0.01; // 1%
export const TDS_PERCENT = 0.10; // 10%

/**
 * Calculates all components of a payout from a single sale amount
 */
export function calculatePayoutComponents(
    saleAmount: number, 
    platformFeePercent: number = DEFAULT_PLATFORM_FEE_PERCENT
): PayoutComponents {
    const tcs = saleAmount * TCS_PERCENT;
    const platformFee = saleAmount * platformFeePercent;
    const gst = platformFee * GST_PERCENT;
    
    const grossPayout = saleAmount - gst - tcs - platformFee;
    
    // TDS is withheld on the payout (gross payout)
    const tds = grossPayout > 0 ? grossPayout * TDS_PERCENT : 0;
    const netPayout = grossPayout - tds;
    
    return {
        saleAmount,
        gst: round(gst),
        tcs: round(tcs),
        platformFee: round(platformFee),
        grossPayout: round(grossPayout),
        tds: round(tds),
        netPayout: round(netPayout)
    };
}

/**
 * Rounds to 2 decimal places
 */
function round(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}
