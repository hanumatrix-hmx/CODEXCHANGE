import * as dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: "../../.env.local" });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL!;
const sql = postgres(connectionString);

async function applyTriggers() {
    console.log("🔥 Applying database triggers...");

    try {
        // Defines function to handle new user creation
        await sql`
      create or replace function public.handle_new_user()
      returns trigger as $$
      begin
        insert into public.profiles (id, email, full_name, avatar_url)
        values (
          new.id, 
          new.email, 
          new.raw_user_meta_data->>'full_name', 
          new.raw_user_meta_data->>'avatar_url'
        );
        return new;
      end;
      $$ language plpgsql security definer;
    `;

        // Drop trigger if exists to avoid duplication errors
        await sql`drop trigger if exists on_auth_user_created on auth.users`;

        // Create the trigger
        await sql`
      create trigger on_auth_user_created
        after insert on auth.users
        for each row execute procedure public.handle_new_user();
    `;

        console.log("✅ Triggers applied successfully!");
    } catch (error) {
        console.error("❌ Failed to apply triggers:", error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

applyTriggers();
