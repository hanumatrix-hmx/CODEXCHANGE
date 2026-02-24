"use client";

import { useState } from "react";
import { setRole } from "./actions";
import { ShoppingCart, Hammer, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Step = "role-selection" | "profile-details";
type Role = "buyer" | "builder" | "admin" | null;

interface OnboardingFormProps {
    initialRole?: Role;
    initialFullName?: string;
}

export function OnboardingForm({ initialRole, initialFullName }: OnboardingFormProps) {
    const [step, setStep] = useState<Step>(initialRole ? "profile-details" : "role-selection");
    const [role, setSelectedRole] = useState<Role>(initialRole || null);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        fullName: initialFullName || "",
        bio: "",
        storeName: "",
        storeSlug: "",
        gstin: "",
        pan: "",
        bankAccountId: "",
        password: "",
    });

    const handleRoleSelect = (selectedRole: "buyer" | "builder") => {
        setSelectedRole(selectedRole);
        setStep("profile-details");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!role || !formData.fullName.trim() || !formData.password || formData.password.length < 6) return;

        // Builder validation
        if (role === "builder") {
            if (!formData.storeName.trim() || !formData.storeSlug.trim() || !formData.gstin.trim() || !formData.pan.trim() || !formData.bankAccountId.trim()) {
                alert("Please fill in all store and compliance details.");
                return;
            }
        }

        setIsLoading(true);

        try {
            await setRole({
                role: role as "buyer" | "builder",
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
                <div className="space-y-2 text-left">
                    <Label htmlFor="fullName" className="text-gray-900 font-semibold">Full Name <span className="text-red-500">*</span></Label>
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

                <div className="space-y-2 text-left">
                    <Label htmlFor="bio" className="text-gray-900 font-semibold">Bio</Label>
                    <Textarea
                        id="bio"
                        placeholder="Tell us a bit about yourself..."
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="resize-none h-24"
                    />
                </div>

                <div className="space-y-2 text-left">
                    <Label htmlFor="password" className="text-gray-900 font-semibold">Create Password <span className="text-red-500">*</span></Label>
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
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">Store Information</h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-left">
                            <div className="space-y-2">
                                <Label htmlFor="storeName" className="text-gray-900 font-semibold">Store Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="storeName"
                                    placeholder="My Asset Store"
                                    value={formData.storeName}
                                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="storeSlug" className="text-gray-900 font-semibold">Store Slug <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm">@</span>
                                    <Input
                                        id="storeSlug"
                                        placeholder="my-store"
                                        className="pl-7"
                                        value={formData.storeSlug}
                                        onChange={(e) => setFormData({ ...formData, storeSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 pt-2">Compliance Details (India)</h3>

                        <div className="space-y-4 text-left">
                            <div className="space-y-2">
                                <Label htmlFor="gstin" className="text-gray-900 font-semibold">GSTIN <span className="text-red-500">*</span></Label>
                                <Input
                                    id="gstin"
                                    placeholder="22AAAAA0000A1Z5"
                                    value={formData.gstin}
                                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase().slice(0, 15) })}
                                    required
                                    maxLength={15}
                                    pattern="[A-Z0-9]{15}"
                                    title="GSTIN should be 15 alphanumeric characters"
                                />
                                <p className="text-[10px] text-gray-500">15-digit alphanumeric (e.g., 22AAAAA0000A1Z5)</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-left">
                                <div className="space-y-2">
                                    <Label htmlFor="pan" className="text-gray-900 font-semibold">PAN <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="pan"
                                        placeholder="ABCDE1234F"
                                        value={formData.pan}
                                        onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase().slice(0, 10) })}
                                        required
                                        maxLength={10}
                                        pattern="[A-Z0-9]{10}"
                                        title="PAN should be 10 alphanumeric characters"
                                    />
                                    <p className="text-[10px] text-gray-500">Exactly 10-digit alphanumeric (e.g., ABCDE1234F)</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bankAccountId" className="text-gray-900 font-semibold">Bank Account / Virtual ID <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="bankAccountId"
                                        placeholder="Enter account number"
                                        value={formData.bankAccountId}
                                        onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value.replace(/\D/g, '').slice(0, 17) })}
                                        required
                                        maxLength={17}
                                    />
                                    <p className="text-[10px] text-gray-500">Max 17 digits - numbers only</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-4 flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setStep("role-selection")}
                        disabled={isLoading || !!initialRole}
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
