import { db, profiles } from "./index";
import { eq } from "drizzle-orm";

async function promote() {
    const userId = "c033f321-bfc0-46a0-9c5d-2101b33842bc";

    console.log(`Promoting user ${userId} to admin...`);

    await db.update(profiles)
        .set({ role: "admin" })
        .where(eq(profiles.id, userId));

    console.log("Success: User is now an admin.");
    process.exit(0);
}

promote().catch(err => {
    console.error("Promotion failed:", err);
    process.exit(1);
});
