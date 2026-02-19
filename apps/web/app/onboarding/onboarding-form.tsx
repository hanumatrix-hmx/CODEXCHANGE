"use client";

import { useState } from "react";
import { setRole } from "./actions";
import { ShoppingCart, Hammer, Loader2, User, Building2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Step = "role-selection" | "profile-details";
type Role = "buyer" | "builder" | null;

export function OnboardingForm() {
    const [step, setStep] = useState<Step>("role-selection");
    const [role, setSelectedRole] = useState<Role>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        fullName: "",
        bio: "",
        companyName: "",
        website: "",
        password: "",
    });

    const handleRoleSelect = (selectedRole: "buyer" | "builder") => {
        setSelectedRole(selectedRole);
        setStep("profile-details");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!role || !formData.fullName.trim() || !formData.password || formData.password.length < 6) return;

        setIsLoading(true);

        try {
            await setRole({
                role,
                ...formData
            });
            // Redirect happens in server action
        } catch (error) {
            console.error("Onboarding failed:", error);
            setIsLoading(false);
            // You could add toast notification here
        }
    };

    if (step === "role-selection") {
        return (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
                {/* Buyer Option */}
                <button
                    onClick={() => handleRoleSelect("buyer")}
                    className="group relative flex flex-col items-center rounded-2xl border-2 border-transparent bg-white p-8 shadow-sm transition-all hover:border-blue-500 hover:shadow-md h-full w-full"
                >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                        <ShoppingCart className="h-10 w-10" />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold text-gray-900">I am a Buyer</h3>
                    <p className="mt-2 text-center text-gray-500">
                        I want to discover and purchase AI tools for my agency.
                    </p>
                </button>

                {/* Builder Option */}
                <button
                    onClick={() => handleRoleSelect("builder")}
                    className="group relative flex flex-col items-center rounded-2xl border-2 border-transparent bg-white p-8 shadow-sm transition-all hover:border-amber-500 hover:shadow-md h-full w-full"
                >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                        <Hammer className="h-10 w-10" />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold text-gray-900">I am a Builder</h3>
                    <p className="mt-2 text-center text-gray-500">
                        I want to list and sell my AI agents, models, and tools.
                    </p>
                </button>
            </div>
        );
    }

    return (
        <div className="mt-8 w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Complete Your Profile
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            id="fullName"
                            placeholder="John Doe"
                            className="pl-9"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                        id="bio"
                        placeholder="Tell us a bit about yourself..."
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="resize-none h-24"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Create Password <span className="text-red-500">*</span></Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="Min 6 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                    />
                    <p className="text-xs text-gray-500">
                        Set a password to log in without Magic Link next time.
                    </p>
                </div>

                {role === "builder" && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="companyName"
                                    placeholder="Acme Inc."
                                    className="pl-9"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="website"
                                    type="url"
                                    placeholder="https://example.com"
                                    className="pl-9"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                />
                            </div>
                        </div>
                    </>
                )}

                <div className="pt-4 flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setStep("role-selection")}
                        disabled={isLoading}
                    >
                        Back
                    </Button>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Complete Setup"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
