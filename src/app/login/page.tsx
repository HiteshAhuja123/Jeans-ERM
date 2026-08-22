import type { Metadata } from "next";
import { CheckCircle2, Shirt } from "lucide-react";

import { LoginForm } from "@/features/auth/login-form";
import { CreatorCredit } from "@/components/shared/creator-credit";

export const metadata: Metadata = {
  title: "Sign in",
};

const valueProps = [
  "Track cutting, sewing, washing and finishing in real time",
  "Catch quality issues before they reach the customer",
  "Never miss a delayed order or a low-stock alert",
];

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_55%)]"
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/15">
            <Shirt className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold">ERM Jeans</span>
        </div>

        <div className="relative flex max-w-md flex-col gap-6">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Run your factory floor from your pocket.
          </h1>
          <ul className="flex flex-col gap-3">
            {valueProps.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-primary-foreground/90">
                <CheckCircle2 className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/70">
          Built for cutting, sewing, washing, finishing, QC, packing and dispatch teams.
        </p>
      </div>

      <div className="flex flex-1 flex-col px-4 py-12 sm:px-6">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="flex w-full max-w-sm flex-col gap-8">
            <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground lg:hidden">
                <Shirt className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">Welcome back</h2>
                <p className="text-sm text-muted-foreground">
                  Sign in to your factory workspace to continue.
                </p>
              </div>
            </div>

            <LoginForm />
          </div>
        </div>

        <div className="flex justify-center pt-8">
          <CreatorCredit />
        </div>
      </div>
    </div>
  );
}
