"use client";

import { useThemeConfig } from "@/lib/theme-hooks";
import { BrandingSettings } from "@zitadel/proto/zitadel/settings/v2/branding_settings_pb";
import { ReactNode } from "react";

type Props = {
  branding?: BrandingSettings;
  hasLeftRightStructure: boolean;
  leftContent: ReactNode;
  rightContent: ReactNode;
};

export function SemsitesLoginLayout({ hasLeftRightStructure, leftContent, rightContent }: Props) {
  const themeConfig = useThemeConfig();
  const formContent = hasLeftRightStructure ? rightContent : leftContent;
  const isFullSplit = themeConfig.brandLayout === "full-split";

  const outerClass = isFullSplit
    ? "relative min-h-screen w-full bg-white dark:bg-white"
    : "relative mx-auto flex min-h-screen w-full max-w-[1180px] items-center px-8 py-4";

  const shellClass = isFullSplit
    ? "grid min-h-screen overflow-hidden bg-white dark:bg-[#0b1115] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
    : "grid min-h-[640px] w-full overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-2xl shadow-slate-950/10 dark:border-white/10 dark:bg-[#0b1115] md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]";

  const brandSectionClass = isFullSplit
    ? "relative flex min-h-[260px] items-center overflow-hidden bg-[#343434] px-8 py-12 text-white lg:min-h-screen lg:px-16"
    : "relative flex min-h-[320px] items-center overflow-hidden bg-[#343434] p-10 text-white md:min-h-[640px]";

  const formSectionClass = isFullSplit
    ? "flex min-h-[360px] min-w-0 items-start justify-center bg-white px-6 py-12 dark:bg-white sm:px-8 lg:min-h-screen lg:items-center"
    : "flex min-h-[320px] min-w-0 items-center justify-start bg-[#f7f6f0] p-8 dark:bg-[#0f171c] sm:p-10 md:min-h-[640px] xl:justify-center";

  const logoSrc = `${process.env.NEXT_PUBLIC_BASE_PATH ?? "/ui/v2/login"}/logo/semsites-logo-icon-colour.png`;

  return (
    <div className={outerClass}>
      <div className={shellClass}>
        <section className={brandSectionClass}>
          <div className="relative z-10 flex items-center gap-5">
            <img src={logoSrc} alt="" className="h-20 w-20 rounded-[20px] object-contain" />
            <div>
              <p className="text-2xl font-bold uppercase tracking-[0.28em] text-[#9cf6d0]">{themeConfig.brandName}</p>
            </div>
          </div>
        </section>

        <section className={formSectionClass}>
          <div className="w-full min-w-0 max-w-[440px]">
            <div className="space-y-6">{formContent}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
