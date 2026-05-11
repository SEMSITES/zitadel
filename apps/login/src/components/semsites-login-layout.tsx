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
  const isFullSplit = themeConfig.brandLayout === "full-split";

  const outerClass = isFullSplit
    ? "relative min-h-screen w-full bg-[#f7f6f0] dark:bg-[#0f171c]"
    : "relative mx-auto flex min-h-screen w-full max-w-[1180px] items-center px-8 py-4";

  const shellClass = isFullSplit
    ? "grid min-h-screen overflow-hidden bg-white dark:bg-[#0b1115] md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
    : "grid min-h-[640px] w-full overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-2xl shadow-slate-950/10 dark:border-white/10 dark:bg-[#0b1115] md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]";

  const brandSectionClass = isFullSplit
    ? "relative flex min-h-[320px] items-center overflow-hidden bg-[#09211e] px-10 py-16 text-white md:min-h-screen md:px-16"
    : "relative flex min-h-[320px] items-center overflow-hidden bg-[#09211e] p-10 text-white md:min-h-[640px]";

  const formSectionClass = isFullSplit
    ? "flex min-h-[320px] min-w-0 items-center justify-start bg-[#f7f6f0] px-6 py-16 dark:bg-[#0f171c] sm:px-8 md:min-h-screen xl:justify-center"
    : "flex min-h-[320px] min-w-0 items-center justify-start bg-[#f7f6f0] p-8 dark:bg-[#0f171c] sm:p-10 md:min-h-[640px] xl:justify-center";

  const logoSrc = `${process.env.NEXT_PUBLIC_BASE_PATH ?? "/ui/v2/login"}/logo/semsites-logo-icon-colour.png`;

  return (
    <div className={outerClass}>
      <div className={shellClass}>
        <section className={brandSectionClass}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,255,207,0.24),transparent_31%),radial-gradient(circle_at_84%_74%,rgba(255,255,255,0.12),transparent_29%),linear-gradient(135deg,#07211e_0%,#0d352e_48%,#0a171b_100%)]" />
          <div className="pointer-events-none absolute -right-24 top-14 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute bottom-12 left-10 h-40 w-40 rounded-full border border-[#92f7cf]/20" />

          <div className="relative z-10 flex items-center gap-4">
            {branding?.lightTheme?.logoUrl || branding?.darkTheme?.logoUrl ? (
              <Logo
                lightSrc={branding.lightTheme?.logoUrl ?? branding.darkTheme?.logoUrl}
                darkSrc={branding.darkTheme?.logoUrl ?? branding.lightTheme?.logoUrl}
                height={44}
                width={172}
              />
            ) : (
              <img src={logoSrc} alt="SEMSITES" className="h-14 w-14 rounded-2xl object-contain" />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#9cf6d0]">{themeConfig.brandName}</p>
              <p className="text-sm text-white/60">Identity Gateway</p>
            </div>
          </div>
        </section>

        <section className={formSectionClass}>
          <div className="min-w-0 w-full max-w-[440px]">
            <div className="space-y-6">{formContent}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
