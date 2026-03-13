import { db } from "./index";
import { orders, payouts } from "./schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { calculatePayoutComponents } from "@codexchange/payment";

/**
 * Get all builders who have unpaid orders
 */
export async function getBuildersWithUnpaidOrders() {
    return await db
        .select({
            builderId: orders.builderId,
        })
        .from(orders)
        .where(
            and(
                eq(orders.status, "paid"),
                isNull(orders.payoutId)
            )
        )
        .groupBy(orders.builderId);
}

/**
 * Get all unpaid orders for a specific builder
 */
export async function getUnpaidOrdersForBuilder(builderId: string) {
    return await db.query.orders.findMany({
        where: and(
            eq(orders.builderId, builderId),
            eq(orders.status, "paid"),
            isNull(orders.payoutId)
        ),
    });
}

/**
 * Create a payout batch for a builder
 */
export async function createPayoutBatch(builderId: string) {
    // 1. Get unpaid orders
    const unpaidOrders = await getUnpaidOrdersForBuilder(builderId);
    
    if (unpaidOrders.length === 0) return null;

    // 2. Calculate totals
    let totalGross = 0;
    let totalTds = 0;
    let totalNet = 0;
    const orderIds: string[] = [];

    for (const order of unpaidOrders) {
        // We use the stored amounts in the order
        // amountBase stores the gross payout (sale - gst - tcs - fee)
        
        const amountTotal = order.amountTotal ? parseFloat(order.amountTotal) : 0;
        const payoutDetails = calculatePayoutComponents(amountTotal);
        
        totalGross += payoutDetails.grossPayout;
        totalTds += payoutDetails.tds;
        totalNet += payoutDetails.netPayout;
        orderIds.push(order.id);
    }

    // 3. Perform transaction to create payout and link orders
    const result = await db.transaction(async (tx) => {
        // Create the payout record
        const [payout] = await tx
            .insert(payouts)
            .values({
                builderId,
                amount: totalGross.toString(),
                tdsDeducted: totalTds.toString(),
                netAmount: totalNet.toString(),
                currency: "INR",
                status: "pending",
                orderIds,
            })
            .returning();

        // Update orders with the payoutId
        await tx
            .update(orders)
            .set({
                payoutId: payout.id,
            })
            .where(
                inArray(orders.id, orderIds)
            );

        return payout;
    });

    return result;
}

/**
 * Process all pending payouts (Aggregator entry point)
 */
export async function aggregateAllPendingPayouts() {
    const builders = await getBuildersWithUnpaidOrders();
    const results = [];

    for (const { builderId } of builders) {
        const payout = await createPayoutBatch(builderId);
        if (payout) {
            results.push(payout);
        }
    }

    return results;
}
