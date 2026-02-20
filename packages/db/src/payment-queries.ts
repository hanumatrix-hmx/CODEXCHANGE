import { db } from "./index";
import { transactions, licenses, assets } from "./schema";
import { eq, desc, sql } from "drizzle-orm";

/**
 * Create a new transaction record
 */
export async function createTransaction(data: {
    assetId: string;
    buyerId: string;
    builderId: string;
    amount: string;
    licenseType: "usage" | "source";
    cashfreeOrderId: string;
    paymentSessionId: string;
}) {
    const [transaction] = await db
        .insert(transactions)
        .values({
            ...data,
            status: "pending",
            currency: "INR",
            paymentGateway: "cashfree",
        })
        .returning();

    return transaction;
}

/**
 * Update transaction status after payment
 */
export async function updateTransactionStatus(
    cashfreeOrderId: string,
    status: string,
    paymentDetails?: any
) {
    const updateData: any = {
        status,
        updatedAt: new Date(),
    };

    if (paymentDetails) {
        updateData.paymentDetails = paymentDetails;
        updateData.gatewayTransactionId = paymentDetails.cf_payment_id;
        updateData.paymentMethod = paymentDetails.payment_group;
    }

    const [transaction] = await db
        .update(transactions)
        .set(updateData)
        .where(eq(transactions.cashfreeOrderId, cashfreeOrderId))
        .returning();

    return transaction;
}

/**
 * Get transaction by Cashfree order ID
 */
export async function getTransactionByOrderId(cashfreeOrderId: string) {
    const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.cashfreeOrderId, cashfreeOrderId),
        with: {
            asset: true,
            buyer: true,
            builder: true,
        },
    });

    return transaction;
}

/**
 * Create a license after successful payment
 */
export async function createLicense(data: {
    assetId: string;
    buyerId: string;
    transactionId: string;
    licenseType: "usage" | "source";
}) {
    // Generate a unique license key
    const licenseKey = `${data.licenseType.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Use a transaction to ensure both license creation and asset update happen atomically
    const result = await db.transaction(async (tx) => {
        // Create the license
        const [license] = await tx
            .insert(licenses)
            .values({
                ...data,
                licenseKey,
                status: "active",
                activatedAt: new Date(),
                // Set expiration based on license type (optional)
                // expiresAt: licenseType === "usage" ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
            })
            .returning();

        // Increment soldLicenses count on the asset
        await tx
            .update(assets)
            .set({
                soldLicenses: sql`${assets.soldLicenses} + 1`,
            })
            .where(eq(assets.id, data.assetId));

        return license;
    });

    return result;
}

/**
 * Get user's transaction history
 */
export async function getUserTransactions(userId: string) {
    const userTransactions = await db.query.transactions.findMany({
        where: eq(transactions.buyerId, userId),
        with: {
            asset: {
                with: {
                    category: true,
                },
            },
        },
        orderBy: [desc(transactions.createdAt)],
    });

    return userTransactions;
}

/**
 * Get license by transaction ID
 */
export async function getLicenseByTransactionId(transactionId: string) {
    const license = await db.query.licenses.findFirst({
        where: eq(licenses.transactionId, transactionId),
    });

    return license;
}
