import { db, profiles } from "./index";
import { eq } from "drizzle-orm";

async function fixUser() {
    const userId = "c033f321-bfc0-46a0-9c5d-2101b33842bc";
    const email = "popeye@example.com"; // Assumption based on paths, will be updated by user on first login

    console.log(`Checking profile for user ${userId}...`);

    const existing = await db.select().from(profiles).where(eq(profiles.id, userId));

    if (existing.length === 0) {
        console.log("Profile missing. Creating...");
        await db.insert(profiles).values({
            id: userId,
            email: email,
            role: "builder",
        });
        console.log("Profile created successfully.");
    } else {
        console.log("Profile already exists.");
    }

    process.exit(0);
}

fixUser().catch(err => {
    console.error(err);
    process.exit(1);
});
