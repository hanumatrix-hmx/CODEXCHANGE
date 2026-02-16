import { db } from "./index";
import { profiles } from "./schema";
import { eq } from "drizzle-orm";

async function makeUserAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.error("❌ Usage: npm run make-admin <email>");
        console.error("   Example: npm run make-admin user@example.com");
        process.exit(1);
    }

    try {
        console.log(`🔍 Looking for user with email: ${email}`);

        // Find user by email
        const user = await db.query.profiles.findFirst({
            where: (profiles, { eq }) => eq(profiles.email, email),
        });

        if (!user) {
            console.error(`❌ User not found with email: ${email}`);
            console.log("\n💡 Make sure the user has signed up first!");
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.fullName || user.email}`);
        console.log(`   Current role: ${user.role}`);

        if (user.role === "admin") {
            console.log("ℹ️  User is already an admin!");
            process.exit(0);
        }

        // Update role to admin
        await db
            .update(profiles)
            .set({ role: "admin" })
            .where(eq(profiles.id, user.id));

        console.log(`\n✅ Successfully updated ${user.email} to admin role!`);
        console.log("\n🎉 User can now access /admin page");
    } catch (error) {
        console.error("❌ Error updating user role:");
        console.error(error);
        process.exit(1);
    }
}

makeUserAdmin();
