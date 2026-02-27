import { OnboardingForm } from "./onboarding-form";
import { createClient } from "@/utils/supabase/server";
import { db } from "@codexchange/db";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    // Get existing profile to check if they already have a role (e.g. admin)
    const profile = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.id, user.id),
    });

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
            <div className="w-full max-w-4xl text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                    Welcome to CODEXCHANGE
                </h1>
                <p className="mt-4 text-xl text-gray-600">
                    Let&apos;s get your account set up.
                </p>

                <OnboardingForm
                    initialRole={profile?.role as any}
                    initialFullName={profile?.fullName || ""}
                />
            </div>
        </div>
    );
}
