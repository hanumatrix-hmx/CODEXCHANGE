"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    X,
    Check,
    ChevronRight,
    Loader2,
    Copy,
    CheckCircle2,
    CreditCard,
    Smartphone,
    Building2,
    Landmark,
    ShieldCheck,
    ArrowLeft,
    AlertCircle,
} from "lucide-react";
import { api } from "@/utils/trpc/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LicenseOption {
    price: number;
    features: string[];
    remaining: number;
    total: number;
}

export interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    assetId: string;
    assetName: string;
    usageLicense: LicenseOption | null;
    sourceLicense: LicenseOption | null;
    /** Which license card was clicked to open the modal */
    defaultLicenseType?: "usage" | "source";
}

type Step = "license" | "billing" | "payment" | "success";
type PaymentMethod = "upi" | "card" | "netbanking" | "emi";

// ─────────────────────────────────────────────────────────────────────────────
// Cashfree global declaration
// ─────────────────────────────────────────────────────────────────────────────

declare global {
    interface Window {
        Cashfree: (opts: { mode: string }) => {
            checkout: (opts: {
                paymentSessionId: string;
                returnUrl?: string;
                redirectTarget?: string;
            }) => Promise<{
                error?: { message: string };
                redirect?: boolean;
                paymentDetails?: { paymentMessage: string };
            }>;
            create: (name: string, options?: any) => any;
            pay: (opts: {
                paymentMethod: any;
                paymentSessionId: string;
                returnUrl?: string;
            }) => Promise<{
                error?: { message: string, code?: string };
                redirect?: boolean;
                paymentDetails?: { paymentMessage: string };
            }>;
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmt(n: number) {
    return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcBilling(price: number) {
    const subtotal = price;
    const platformFee = subtotal * 0.16;
    const gst = platformFee * 0.18;
    const tcs = subtotal * 0.01;
    const total = subtotal + tcs; // TCS is collected FROM buyer on top
    return { subtotal, platformFee, gst, tcs, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────

const STEP_LABELS: { id: Step; label: string }[] = [
    { id: "license", label: "License" },
    { id: "billing", label: "Summary" },
    { id: "payment", label: "Payment" },
    { id: "success", label: "Done" },
];
const STEP_ORDER: Step[] = ["license", "billing", "payment", "success"];

function StepIndicator({ current }: { current: Step }) {
    const idx = STEP_ORDER.indexOf(current);
    return (
        <div className="flex items-center justify-center gap-0 mb-6">
            {STEP_LABELS.map((s, i) => {
                const done = i < idx;
                const active = i === idx;
                return (
                    <div key={s.id} className="flex items-center">
                        <div className="flex flex-col items-center">
                            <div
                                className={[
                                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                                    done
                                        ? "bg-indigo-600 text-white"
                                        : active
                                            ? "bg-indigo-600 text-white ring-4 ring-indigo-600/20"
                                            : "bg-white/10 text-slate-500",
                                ].join(" ")}
                            >
                                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                            </div>
                            <span
                                className={[
                                    "mt-1 text-[10px] font-medium",
                                    active ? "text-indigo-400" : done ? "text-slate-400" : "text-slate-600",
                                ].join(" ")}
                            >
                                {s.label}
                            </span>
                        </div>
                        {i < STEP_LABELS.length - 1 && (
                            <div
                                className={[
                                    "mx-2 mb-4 h-px w-10 transition-all duration-500",
                                    i < idx ? "bg-indigo-600" : "bg-white/10",
                                ].join(" ")}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// License card (Step 1)
// ─────────────────────────────────────────────────────────────────────────────

function LicenseCard({
    type,
    option,
    selected,
    onSelect,
}: {
    type: "usage" | "source";
    option: LicenseOption;
    selected: boolean;
    onSelect: () => void;
}) {
    const config = {
        usage: {
            label: "Usage License",
            sublabel: "Deploy & ship to production",
            icon: "🚀",
            accent: "indigo",
        },
        source: {
            label: "Source Code",
            sublabel: "Full access + white-label rights",
            icon: "💎",
            accent: "violet",
        },
    }[type];

    const pct = Math.min(100, Math.round((option.remaining / option.total) * 100));
    const almostGone = option.remaining <= Math.ceil(option.total * 0.2);

    return (
        <button
            type="button"
            onClick={onSelect}
            disabled={option.remaining === 0}
            className={[
                "group relative flex w-full flex-col rounded-xl border p-4 text-left transition-all duration-200 focus:outline-none",
                option.remaining === 0
                    ? "cursor-not-allowed opacity-50 border-white/10 bg-white/3"
                    : selected
                        ? type === "usage"
                            ? "border-indigo-500 bg-indigo-600/10 shadow-lg shadow-indigo-500/10"
                            : "border-violet-500 bg-violet-600/10 shadow-lg shadow-violet-500/10"
                        : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5",
            ].join(" ")}
        >
            {selected && (
                <span
                    className={[
                        "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full",
                        type === "usage" ? "bg-indigo-600" : "bg-violet-600",
                    ].join(" ")}
                >
                    <Check className="h-3 w-3 text-white" />
                </span>
            )}

            <div className="mb-3 flex items-center gap-2">
                <span className="text-xl">{config.icon}</span>
                <div>
                    <p className="text-sm font-semibold text-slate-100">{config.label}</p>
                    <p className="text-xs text-slate-500">{config.sublabel}</p>
                </div>
            </div>

            <p className="mb-3 text-2xl font-bold text-white">
                ₹{fmt(option.price)}
                <span className="ml-1 text-xs font-normal text-slate-500">one-time</span>
            </p>

            {/* Scarcity bar */}
            <div className="mb-3">
                <div className="mb-1 flex justify-between text-[10px] text-slate-500">
                    <span>{option.remaining} left of {option.total}</span>
                    {almostGone && option.remaining > 0 && (
                        <span className="font-semibold text-amber-400">Almost gone!</span>
                    )}
                    {option.remaining === 0 && (
                        <span className="font-semibold text-red-400">Sold Out</span>
                    )}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                        className={[
                            "h-full rounded-full transition-all duration-500",
                            pct <= 20 ? "bg-amber-500" : type === "usage" ? "bg-indigo-500" : "bg-violet-500",
                        ].join(" ")}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            {/* Features */}
            <ul className="space-y-1.5">
                {option.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-500" />
                        {f}
                    </li>
                ))}
                {option.features.length > 4 && (
                    <li className="text-xs text-slate-600">+{option.features.length - 4} more</li>
                )}
            </ul>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Billing row helper
// ─────────────────────────────────────────────────────────────────────────────

function BillingRow({
    label,
    value,
    sub,
    bold,
    highlight,
}: {
    label: string;
    value: string;
    sub?: string;
    bold?: boolean;
    highlight?: boolean;
}) {
    return (
        <div
            className={[
                "flex items-start justify-between py-2.5",
                highlight ? "border-t border-white/10 mt-1 pt-3.5" : "",
            ].join(" ")}
        >
            <div>
                <span className={[
                    "text-sm",
                    bold ? "font-semibold text-white" : "text-slate-400",
                ].join(" ")}>{label}</span>
                {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
            </div>
            <span className={[
                "text-sm tabular-nums",
                bold ? "font-bold text-white text-base" : "text-slate-300",
                highlight ? "text-indigo-400" : "",
            ].join(" ")}>{value}</span>
        </div>
    );
}

function PaymentMethodTab({
    method: _method,
    label,
    icon: Icon,
    selected,
    onSelect,
}: {
    method: PaymentMethod;
    label: string;
    icon: React.ElementType;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={[
                "flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all focus:outline-none",
                selected
                    ? "border-indigo-500 bg-indigo-600/10 text-indigo-300 shadow-sm"
                    : "border-white/10 bg-white/3 text-slate-300 hover:border-white/20 hover:bg-white/5",
            ].join(" ")}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Copy-to-clipboard button
// ─────────────────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    function handleCopy() {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }
    return (
        <button
            type="button"
            onClick={handleCopy}
            title="Copy license key"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:border-indigo-500 hover:text-indigo-400 focus:outline-none"
        >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main modal
// ─────────────────────────────────────────────────────────────────────────────

export function CheckoutModal({
    isOpen,
    onClose,
    assetId,
    assetName,
    usageLicense,
    sourceLicense,
    defaultLicenseType = "usage",
}: CheckoutModalProps) {
    const [step, setStep] = useState<Step>("license");
    const [selectedLicense, setSelectedLicense] = useState<"usage" | "source">(defaultLicenseType);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
    const [gstin, setGstin] = useState("");
    const [showGstin, setShowGstin] = useState(false);

    const [licenseKey, setLicenseKey] = useState<string | null>(null);
    const [payError, setPayError] = useState<string | null>(null);
    const [isPayLoading, setIsPayLoading] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    const createOrder = api.payment.createOrder.useMutation();
    const verifyPayment = api.payment.verifyPayment.useMutation();

    // Load Cashfree SDK once
    useEffect(() => {
        if (!document.getElementById("cashfree-sdk")) {
            const s = document.createElement("script");
            s.id = "cashfree-sdk";
            s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
            s.async = true;
            document.body.appendChild(s);
        }
    }, []);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep("license");
            setSelectedLicense(defaultLicenseType);
            setLicenseKey(null);
            setPayError(null);
            setIsPayLoading(false);
            setShowGstin(false);
            setGstin("");
        }
    }, [isOpen, defaultLicenseType]);

    // Close on overlay click
    function handleOverlayClick(e: React.MouseEvent) {
        if (e.target === overlayRef.current) {
            if (step !== "success") onClose();
        }
    }

    // Close on Escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && isOpen && step !== "success") onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, step, onClose]);

    // ── Step navigation ──────────────────────────────────────────────────────

    const goToStep = useCallback((s: Step) => {
        setStep(s);
    }, []);

    async function handleContinueFromLicense() {
        const opt = selectedLicense === "usage" ? usageLicense : sourceLicense;
        if (!opt) return;
        setPayError(null);
        goToStep("billing");
    }

    async function handlePay() {
        setPayError(null);
        setIsPayLoading(true);

        try {
            if (typeof window === "undefined" || !window.Cashfree) {
                throw new Error("Payment SDK not ready. Please wait a moment and try again.");
            }

            if (showGstin && gstin.trim().length > 0 && gstin.trim().length !== 15) {
                throw new Error("GSTIN must be exactly 15 characters long.");
            }

            // Create the order with the selected payment constraint
            const result = await createOrder.mutateAsync({
                assetId,
                licenseType: selectedLicense,
                paymentMethod,
                ...(showGstin && gstin.trim().length === 15 ? { buyerGstin: gstin.trim() } : {}),
            });

            if (result.isFree) {
                // Free asset — skip straight to verify/ success
                verifyPayment.mutate(
                    { orderId: result.orderId },
                    {
                        onSuccess: (data: any) => {
                            setLicenseKey(data.license?.licenseKey || null);
                            setIsPayLoading(false);
                            goToStep("success");
                        },
                        onError: () => {
                            setLicenseKey(null);
                            setIsPayLoading(false);
                            goToStep("success");
                        },
                    }
                );
                return;
            }

            const cashfree = window.Cashfree({
                mode: (process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT as string) || "sandbox",
            });

            const origin = window.location.origin;
            const cfResult = await cashfree.checkout({
                paymentSessionId: result.paymentSessionId,
                returnUrl: `${origin}/payment/verify?order_id=${result.orderId}`,
            });

            if (cfResult.error) {
                throw new Error(cfResult.error.message || "Payment failed");
            }

            if (cfResult.paymentDetails) {
                // Payment confirmed client-side — verify server-side
                verifyPayment.mutate(
                    { orderId: result.orderId },
                    {
                        onSuccess: (data: any) => {
                            setLicenseKey(data.license?.licenseKey || null);
                            setIsPayLoading(false);
                            goToStep("success");
                        },
                        onError: () => {
                            setIsPayLoading(false);
                            setPayError("Payment received but verification failed. Please check your dashboard.");
                        },
                    }
                );
                return;
            }

        } catch (err: any) {
            setPayError(err?.message || "Failed to initiate payment. Please try again.");
            setIsPayLoading(false);
        }
    }
    // ── Derived ──────────────────────────────────────────────────────────────

    const activeLicenseOption = selectedLicense === "usage" ? usageLicense : sourceLicense;
    const billing = activeLicenseOption ? calcBilling(activeLicenseOption.price) : null;
    const showEmi = billing ? billing.total > 3000 : false;
    const isBillingLoading = createOrder.isPending;

    if (!isOpen) return null;

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
            style={{ animation: "fadeIn 200ms ease-out" }}
        >
            <div
                className="relative w-full max-w-lg overflow-hidden rounded-t-2xl sm:rounded-2xl bg-[#0d1117] border border-white/8 shadow-2xl"
                style={{ animation: "slideUp 280ms cubic-bezier(0.22,1,0.36,1)" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
                    {step !== "license" && step !== "success" ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (step === "billing") goToStep("license");
                                if (step === "payment") goToStep("billing");
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/8 hover:text-white transition focus:outline-none"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    ) : (
                        <div className="h-8 w-8" />
                    )}

                    <div className="text-center">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Checkout</p>
                        <p className="text-sm font-semibold text-slate-200 truncate max-w-[220px]">{assetName}</p>
                    </div>

                    {step !== "success" ? (
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/8 hover:text-white transition focus:outline-none"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : (
                        <div className="h-8 w-8" />
                    )}
                </div>

                {/* Step indicator */}
                <div className="px-6 pt-5">
                    <StepIndicator current={step} />
                </div>

                {/* Error banner */}
                {payError && (
                    <div className="mx-6 mb-4 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                        <p className="text-xs text-red-300">{payError}</p>
                    </div>
                )}

                {/* ── STEP 1: License Selection ──────────────────────────── */}
                {step === "license" && (
                    <div className="px-6 pb-6" style={{ animation: "stepIn 250ms cubic-bezier(0.22,1,0.36,1)" }}>
                        <h2 className="mb-1 text-base font-semibold text-white">Choose your license</h2>
                        <p className="mb-4 text-xs text-slate-500">One-time purchase · Instant delivery</p>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {usageLicense && (
                                <LicenseCard
                                    type="usage"
                                    option={usageLicense}
                                    selected={selectedLicense === "usage"}
                                    onSelect={() => setSelectedLicense("usage")}
                                />
                            )}
                            {sourceLicense && (
                                <LicenseCard
                                    type="source"
                                    option={sourceLicense}
                                    selected={selectedLicense === "source"}
                                    onSelect={() => setSelectedLicense("source")}
                                />
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleContinueFromLicense}
                            disabled={!activeLicenseOption || activeLicenseOption.remaining === 0}
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none"
                        >
                            Continue
                            <ChevronRight className="h-4 w-4" />
                        </button>

                        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-600">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            Secured by Cashfree · 256-bit SSL
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Billing Summary ────────────────────────────── */}
                {step === "billing" && (
                    <div className="px-6 pb-6" style={{ animation: "stepIn 250ms cubic-bezier(0.22,1,0.36,1)" }}>
                        <h2 className="mb-1 text-base font-semibold text-white">Billing summary</h2>
                        <p className="mb-4 text-xs text-slate-500">
                            {selectedLicense === "usage" ? "Usage License" : "Source Code License"}
                        </p>

                        {isBillingLoading ? (
                            <div className="space-y-3 py-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="flex justify-between">
                                        <div className="h-4 w-28 rounded bg-white/8 animate-pulse" />
                                        <div className="h-4 w-16 rounded bg-white/8 animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        ) : billing ? (
                            <div className="divide-y divide-white/5 rounded-xl border border-white/8 bg-white/3 px-4">
                                <BillingRow label="Subtotal" value={`₹${fmt(billing.subtotal)}`} />
                                <BillingRow
                                    label="TCS"
                                    value={`₹${fmt(billing.tcs)}`}
                                    sub="1% Tax Collected at Source (Sec 206C)"
                                />
                                <BillingRow
                                    label="Total"
                                    value={`₹${fmt(billing.total)}`}
                                    bold
                                    highlight
                                />
                            </div>
                        ) : null}

                        {/* GSTIN (B2B) */}
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={() => setShowGstin(v => !v)}
                                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition focus:outline-none"
                            >
                                {showGstin ? <Check className="h-3 w-3" /> : <span className="text-base leading-none">+</span>}
                                {showGstin ? "Remove GSTIN" : "I have a GSTIN (B2B purchase)"}
                            </button>
                            {showGstin && (
                                <input
                                    type="text"
                                    value={gstin}
                                    onChange={e => setGstin(e.target.value.toUpperCase())}
                                    placeholder="22AAAAA0000A1Z5"
                                    maxLength={15}
                                    className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                                    style={{ animation: "stepIn 180ms ease-out" }}
                                />
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => goToStep("payment")}
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none"
                        >
                            {isBillingLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Preparing order…
                                </>
                            ) : (
                                <>
                                    Continue to Payment
                                    <ChevronRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* ── STEP 3: Payment Method ─────────────────────────────── */}
                {step === "payment" && (
                    <div className="px-6 pb-6" style={{ animation: "stepIn 250ms cubic-bezier(0.22,1,0.36,1)" }}>
                        <h2 className="mb-1 text-base font-semibold text-white">Select payment method</h2>
                        {billing && (
                            <p className="mb-4 text-xs text-slate-500">
                                You&apos;ll be charged{" "}
                                <span className="font-semibold text-indigo-400">₹{fmt(billing.total)}</span>
                            </p>
                        )}

                        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                            <PaymentMethodTab
                                method="upi"
                                label="UPI"
                                icon={Smartphone}
                                selected={paymentMethod === "upi"}
                                onSelect={() => setPaymentMethod("upi")}
                            />
                            <PaymentMethodTab
                                method="card"
                                label="Card"
                                icon={CreditCard}
                                selected={paymentMethod === "card"}
                                onSelect={() => setPaymentMethod("card")}
                            />
                            <PaymentMethodTab
                                method="netbanking"
                                label="Net Banking"
                                icon={Building2}
                                selected={paymentMethod === "netbanking"}
                                onSelect={() => setPaymentMethod("netbanking")}
                            />
                            {showEmi && (
                                <PaymentMethodTab
                                    method="emi"
                                    label="EMI"
                                    icon={Landmark}
                                    selected={paymentMethod === "emi"}
                                    onSelect={() => setPaymentMethod("emi")}
                                />
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handlePay}
                            disabled={isPayLoading}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none"
                        >
                            {isPayLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Preparing Secure Checkout…
                                </>
                            ) : (
                                <>Pay ₹{fmt(billing?.total || 0)}</>
                            )}
                        </button>

                        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-600">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            100% secure · Powered by Cashfree Payments
                        </div>
                    </div>
                )}

                {/* ── STEP 4: Success ────────────────────────────────────── */}
                {step === "success" && (
                    <div
                        className="px-6 pb-8 text-center"
                        style={{ animation: "stepIn 350ms cubic-bezier(0.22,1,0.36,1)" }}
                    >
                        {/* Animated checkmark */}
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/20 ring-8 ring-emerald-600/10">
                            <CheckCircle2 className="h-9 w-9 text-emerald-400" style={{ animation: "popIn 400ms cubic-bezier(0.22,1,0.36,1)" }} />
                        </div>

                        <h2 className="text-xl font-bold text-white">Payment Successful!</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Your {selectedLicense === "usage" ? "Usage" : "Source Code"} License is now active.
                        </p>

                        {licenseKey && (
                            <div className="mt-6 rounded-xl border border-white/8 bg-white/3 p-4 text-left">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                                    License Key
                                </p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-white/5 px-3 py-2 font-mono text-xs text-emerald-300">
                                        {licenseKey}
                                    </code>
                                    <CopyButton text={licenseKey} />
                                </div>
                                <p className="mt-2 text-[10px] text-slate-600">
                                    Store this key securely. You can also find it in your Dashboard.
                                </p>
                            </div>
                        )}

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <a
                                href="/dashboard"
                                className="flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 focus:outline-none"
                            >
                                Go to Dashboard
                            </a>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex items-center justify-center rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/8 focus:outline-none"
                            >
                                Continue Browsing
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(24px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes stepIn {
                    from { opacity: 0; transform: translateX(16px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes popIn {
                    from { transform: scale(0.4); opacity: 0; }
                    60%  { transform: scale(1.15); }
                    to   { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
