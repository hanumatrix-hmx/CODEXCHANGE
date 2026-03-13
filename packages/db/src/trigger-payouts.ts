import { aggregateAllPendingPayouts } from "./payout-queries";
import { initiateTransfer } from "@codexchange/payment";
import { db } from "./index";
import { payouts } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Manual trigger for payouts (Dev/Admin Tool)
 * 
 * This script will:
 * 1. Find all paid orders that haven't been batched into a payout yet.
 * 2. Group them by builder and create payout records.
 * 3. (Optional) Initiate Cashfree transfers for each payout.
 */
async function runPayoutProcess() {
    console.log("🚀 Starting Payout Process...");

    try {
        // 1. Aggregate orders into payouts
        console.log("📊 Aggregating unpaid orders...");
        const newPayouts = await aggregateAllPendingPayouts();

        if (newPayouts.length === 0) {
            console.log("✅ No pending orders to payout.");
            process.exit(0);
        }

        console.log(`📦 Created ${newPayouts.length} payout batches.`);

        // 2. Process each payout
        for (const payout of newPayouts) {
            console.log(`\n💸 Processing Payout ID: ${payout.id}`);
            console.log(`   Builder ID: ${payout.builderId}`);
            console.log(`   Net Amount: ${payout.netAmount} ${payout.currency}`);

            try {
                // In dev, we might want to skip the actual transfer or 
                // just call it if we are in sandbox mode.
                const transferResult = await initiateTransfer({
                    payoutId: payout.id,
                    amount: parseFloat(payout.netAmount),
                    builderId: payout.builderId,
                });

                if (transferResult.success) {
                    console.log(`   ✅ Transfer initiated! CF ID: ${transferResult.cfTransferId}`);
                    
                    // Update payout record with transfer details
                    await db.update(payouts)
                        .set({
                            cfTransferId: transferResult.cfTransferId,
                            transferStatus: transferResult.status,
                            status: transferResult.status === "SUCCESS" ? "completed" : "scheduled",
                            processedAt: new Date()
                        })
                        .where(eq(payouts.id, payout.id));
                }
            } catch (transferError) {
                console.error(`   ❌ Failed to initiate transfer for ${payout.id}:`, transferError);
                // Mark payout as failed
                await db.update(payouts)
                    .set({
                        status: "failed"
                    })
                    .where(eq(payouts.id, payout.id));
            }
        }

        console.log("\n✨ Payout process completed.");
        process.exit(0);
    } catch (error) {
        console.error("💥 Critical error during payout process:", error);
        process.exit(1);
    }
}

// Run the script
runPayoutProcess();
