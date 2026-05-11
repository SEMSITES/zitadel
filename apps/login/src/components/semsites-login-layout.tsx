"use client";

import { Logo } from "@/components/logo";
import { useThemeConfig } from "@/lib/theme-hooks";
import { BrandingSettings } from "@zitadel/proto/zitadel/settings/v2/branding_settings_pb";
import { ReactNode } from "react";

type Props = {
  branding?: BrandingSettings;
  hasLeftRightStructure: boolean;
  leftContent: ReactNode;
  rightContent: ReactNode;
};

export function SemsitesLoginLayout({ branding, hasLeftRightStructure, leftContent, rightContent }: Props) {
  const themeConfig = useThemeConfig();
  const formContent = hasLeftRightStructure ? rightContent : leftContent;

  return (
    <div className="relative mx-auto w-full max-w-[1180px] px-8 py-4">
      <div className="grid min-h-[620px] overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-2xl shadow-slate-950/10 lg:grid-cols-[1.04fr_0.96fr] dark:border-white/10 dark:bg-[#0b1115]">
        <section className="relative flex min-h-[620px] flex-col justify-between overflow-hidden bg-[#09211e] p-10 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,255,207,0.24),transparent_31%),radial-gradient(circle_at_84%_74%,rgba(255,255,255,0.12),transparent_29%),linear-gradient(135deg,#07211e_0%,#0d352e_48%,#0a171b_100%)]" />
          <div className="pointer-events-none absolute top-16 -right-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute bottom-20 left-10 h-40 w-40 rounded-full border border-[#92f7cf]/20" />

          <div className="relative z-10 flex items-center gap-4">
            {branding?.lightTheme?.logoUrl || branding?.darkTheme?.logoUrl ? (
              <Logo
                lightSrc={branding.lightTheme?.logoUrl ?? branding.darkTheme?.logoUrl}
                darkSrc={branding.darkTheme?.logoUrl ?? branding.lightTheme?.logoUrl}
                height={44}
                width={172}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-sm font-black tracking-[0.22em]">
                SS
              </div>
            )}
            <div>
              <p className="text-xs font-bold tracking-[0.32em] text-[#9cf6d0] uppercase">{themeConfig.brandName}</p>
              <p className="text-sm text-white/60">Identity Gateway</p>
            </div>
          </div>

          <div className="relative z-10 max-w-[480px] space-y-8">
            <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.24em] text-[#9cf6d0] uppercase">
              {themeConfig.brandEyebrow}
            </div>
            <div className="space-y-5">
              <h2 className="text-5xl leading-[0.98] font-black tracking-[-0.05em] text-white">
                {themeConfig.brandHeadline}
              </h2>
              <p className="max-w-[420px] text-base leading-7 text-white/70">{themeConfig.brandDescription}</p>
            </div>
            {hasLeftRightStructure && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
                <div className="space-y-3 [&_h1]:text-left [&_h1]:text-xl [&_h1]:font-black [&_h1]:text-white [&_p]:text-left [&_p]:text-sm [&_p]:leading-6 [&_p]:text-white/70">
                  {leftContent}
                </div>
              </div>
            )}
          </div>

          <p className="relative z-10 max-w-[420px] text-xs leading-5 text-white/50">{themeConfig.brandFootnote}</p>
        </section>

        <section className="flex items-center justify-center bg-[#f7f6f0] p-10 dark:bg-[#0f171c]">
          <div className="w-full max-w-[440px] rounded-[1.5rem] border border-black/10 bg-white p-8 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-[#121d23]">
            <div className="space-y-6">{formContent}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
