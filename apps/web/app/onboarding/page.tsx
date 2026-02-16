import { OnboardingForm } from "./onboarding-form";

export default function OnboardingPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
            <div className="w-full max-w-4xl text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                    Welcome to CODEXCHANGE
                </h1>
                <p className="mt-4 text-xl text-gray-600">
                    Let's get your account set up.
                </p>

                <OnboardingForm />
            </div>
        </div>
    );
}
