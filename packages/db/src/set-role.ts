import { db } from "./index";
import { profiles } from "./schema";
import { eq } from "drizzle-orm";

async function setUserRole() {
    const email = process.argv[2];
    const role = process.argv[3] as "buyer" | "builder" | "admin";

    if (!email || !role) {
        console.error("❌ Usage: npm run set-role <email> <role>");
        console.error("   Example: npm run set-role user@example.com buyer");
        process.exit(1);
    }

    const validRoles = ["buyer", "builder", "admin"];
    if (!validRoles.includes(role)) {
        console.error(`❌ Invalid role: ${role}. Valid roles are: ${validRoles.join(", ")}`);
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
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.fullName || user.email}`);
        console.log(`   Current role: ${user.role}`);

        if (user.role === role) {
            console.log(`ℹ️  User already has the role: ${role}`);
            process.exit(0);
        }

        // Update role
        await db
            .update(profiles)
            .set({ role })
            .where(eq(profiles.id, user.id));

        console.log(`\n✅ Successfully updated ${user.email} to ${role} role!`);
    } catch (error) {
        console.error("❌ Error updating user role:");
        console.error(error);
        process.exit(1);
    }
}

setUserRole();
