"use client";

import { APPEARANCE_STYLES, getComponentRoundness, getThemeConfig } from "@/lib/theme";
import { ThemeableProps } from "@/lib/themeUtils";
import { clsx } from "clsx";
import { ButtonHTMLAttributes, DetailedHTMLProps, forwardRef } from "react";
import type { SurfaceTheme } from "./surface-theme";
import { useSurfaceTheme } from "./surface-theme";

export enum ButtonSizes {
  Small = "Small",
  Large = "Large",
}

export enum ButtonVariants {
  Primary = "Primary",
  Secondary = "Secondary",
  Destructive = "Destructive",
}

export enum ButtonColors {
  Neutral = "Neutral",
  Primary = "Primary",
  Warn = "Warn",
}

export type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  size?: ButtonSizes;
  variant?: ButtonVariants;
  color?: ButtonColors;
} & ThemeableProps;

export const getButtonClasses = (
  size: ButtonSizes,
  variant: ButtonVariants,
  color: ButtonColors,
  roundnessClasses: string = "rounded-md", // Default fallback
  appearance: string = "", // Theme appearance (shadows, borders, etc.)
  surfaceTheme: SurfaceTheme = "inherit",
) =>
  clsx(
    {
      "box-border leading-36px text-14px inline-flex items-center focus:outline-none transition-colors transition-shadow duration-300": true,
      "disabled:border-none disabled:bg-gray-300 disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed":
        variant === ButtonVariants.Primary,
      "disabled:dark:bg-gray-700 disabled:dark:text-gray-900":
        variant === ButtonVariants.Primary && surfaceTheme !== "light",
      "bg-primary-light-500 hover:bg-primary-light-400 text-primary-light-contrast-500":
        variant === ButtonVariants.Primary && color !== ButtonColors.Warn,
      "dark:bg-primary-dark-500 hover:dark:bg-primary-dark-400 dark:text-primary-dark-contrast-500":
        variant === ButtonVariants.Primary && color !== ButtonColors.Warn && surfaceTheme !== "light",
      "bg-warn-light-500 hover:bg-warn-light-400 text-white":
        variant === ButtonVariants.Primary && color === ButtonColors.Warn,
      "dark:bg-warn-dark-500 hover:dark:bg-warn-dark-400 dark:text-white":
        variant === ButtonVariants.Primary && color === ButtonColors.Warn && surfaceTheme !== "light",
      "border border-button-light-border text-gray-950 hover:bg-gray-500 hover:bg-opacity-20 focus:bg-gray-500 focus:bg-opacity-20 disabled:text-gray-600 disabled:hover:bg-transparent disabled:cursor-not-allowed":
        variant === ButtonVariants.Secondary,
      "dark:border-button-dark-border hover:dark:bg-white hover:dark:bg-opacity-10 focus:dark:bg-white focus:dark:bg-opacity-10 dark:text-white disabled:dark:hover:bg-transparent disabled:dark:text-gray-900":
        variant === ButtonVariants.Secondary && surfaceTheme !== "light",
      "border border-button-light-border text-warn-light-500 hover:bg-warn-light-500 hover:bg-opacity-10 focus:bg-warn-light-500 focus:bg-opacity-20":
        color === ButtonColors.Warn && variant !== ButtonVariants.Primary,
      "dark:border-button-dark-border dark:text-warn-dark-500 dark:hover:bg-warn-light-500 dark:hover:bg-opacity-10 dark:focus:bg-warn-light-500 dark:focus:bg-opacity-20":
        color === ButtonColors.Warn && variant !== ButtonVariants.Primary && surfaceTheme !== "light",
      "px-16 py-2": size === ButtonSizes.Large,
      "px-4 h-[36px]": size === ButtonSizes.Small,
    },
    roundnessClasses, // Apply the full roundness classes directly
    appearance, // Apply appearance-specific styling (shadows, borders, etc.)
  );

// Helper function to get default button roundness from theme
function getDefaultButtonRoundness(): string {
  return getComponentRoundness("button");
}

// Helper function to get default button appearance from centralized theme system
function getDefaultButtonAppearance(): string {
  const themeConfig = getThemeConfig();
  const appearance = APPEARANCE_STYLES[themeConfig.appearance];
  return appearance?.button || "border border-button-light-border dark:border-button-dark-border"; // Fallback to flat design
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = ButtonVariants.Primary,
      size = ButtonSizes.Small,
      color = ButtonColors.Primary,
      roundness, // Will use theme default if not provided
      ...props
    },
    ref,
  ) => {
    const surfaceTheme = useSurfaceTheme();
    // Use theme-based values if not explicitly provided
    const actualRoundness = roundness || getDefaultButtonRoundness();
    const actualAppearance = getDefaultButtonAppearance();

    return (
      <button
        type="button"
        ref={ref}
        className={`${getButtonClasses(size, variant, color, actualRoundness, actualAppearance, surfaceTheme)} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);
