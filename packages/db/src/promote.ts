import { db, profiles } from "./index";
import { eq } from "drizzle-orm";

async function promote() {
    const email = process.argv[2];

    if (!email) {
        console.error("Please provide an email address.");
        console.log("Usage: pnpm db:promote <email>");
        process.exit(1);
    }

    console.log(`Searching for user with email: ${email}...`);

    const userProfile = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.email, email),
    });

    if (!userProfile) {
        console.error(`Error: User with email ${email} not found in profiles table.`);
        process.exit(1);
    }

    console.log(`Promoting ${email} (ID: ${userProfile.id}) to admin...`);

    await db.update(profiles)
        .set({ role: "admin" })
        .where(eq(profiles.id, userProfile.id));

    console.log(`SUCCESS: ${email} is now an admin.`);
    process.exit(0);
}

promote().catch(err => {
    console.error("Promotion failed:", err);
    process.exit(1);
});
