"use client";

import { getComponentRoundness } from "@/lib/theme";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { clsx } from "clsx";
import { ChangeEvent, DetailedHTMLProps, forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { useSurfaceTheme } from "./surface-theme";

export type TextInputProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  label: string;
  suffix?: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string | ReactNode;
  success?: string | ReactNode;
  disabled?: boolean;
  onChange?: (value: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (value: ChangeEvent<HTMLInputElement>) => void;
  roundness?: string; // Allow override via props
};

const styles = (error: boolean, disabled: boolean, forceLight: boolean, roundnessClasses: string = "rounded-md") =>
  clsx(
    {
      "h-[40px] mb-[2px] p-[7px] bg-input-light-background transition-colors duration-300 grow": true,
      "dark:bg-input-dark-background": !forceLight,
      "border border-input-light-border hover:border-black focus:border-primary-light-500": true,
      "dark:border-input-dark-border hover:dark:border-white focus:dark:border-primary-dark-500": !forceLight,
      "focus:outline-none focus:ring-0 text-base text-black placeholder:italic placeholder-gray-700": true,
      "dark:text-white dark:placeholder-gray-700": !forceLight,
      "border border-warn-light-500 hover:border-warn-light-500 focus:border-warn-light-500": error,
      "dark:border-warn-dark-500 hover:dark:border-warn-dark-500 focus:dark:border-warn-dark-500": error && !forceLight,
      "pointer-events-none text-gray-500 border border-input-light-border hover:border-light-hoverborder cursor-default":
        disabled,
      "dark:text-gray-800 dark:border-input-dark-border hover:dark:border-hoverborder": disabled && !forceLight,
    },
    roundnessClasses, // Apply the full roundness classes directly
  );

// Helper function to get default input roundness from theme
function getDefaultInputRoundness(): string {
  return getComponentRoundness("input");
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      placeholder,
      defaultValue,
      suffix,
      required = false,
      error,
      disabled,
      success,
      onChange,
      onBlur,
      roundness,
      ...props
    },
    ref,
  ) => {
    const forceLight = useSurfaceTheme() === "light";
    // Use theme-based roundness if not explicitly provided
    const actualRoundness = roundness || getDefaultInputRoundness();

    return (
      <label
        className={`relative flex flex-col text-12px text-input-light-label ${forceLight ? "" : "dark:text-input-dark-label"}`}
      >
        <span
          className={`mb-1 leading-3 ${error ? `text-warn-light-500 ${forceLight ? "" : "dark:text-warn-dark-500"}` : ""}`}
        >
          {label} {required && "*"}
        </span>
        <input
          suppressHydrationWarning
          ref={ref}
          className={styles(!!error, !!disabled, forceLight, actualRoundness)}
          defaultValue={defaultValue}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={props.autoComplete ?? "off"}
          onChange={(e) => onChange && onChange(e)}
          onBlur={(e) => onBlur && onBlur(e)}
          {...props}
        />

        {suffix && (
          <span
            className={clsx(
              "absolute bottom-[22px] right-[3px] z-30 translate-y-1/2 transform bg-background-light-500 p-2",
              !forceLight && "dark:bg-background-dark-500",
              // Extract just the roundness part for the suffix (no padding)
              actualRoundness.split(" ")[0], // Take only the first part (rounded-full, rounded-md, etc.)
            )}
          >
            @{suffix}
          </span>
        )}

        <div className="leading-14.5px h-14.5px flex flex-row items-center text-12px text-warn-light-500 dark:text-warn-dark-500">
          <span>{error ? error : " "}</span>
        </div>

        {success && (
          <div className="text-md mt-1 flex flex-row items-center text-green-500">
            <CheckCircleIcon className="h-4 w-4" />
            <span className="ml-1">{success}</span>
          </div>
        )}
      </label>
    );
  },
);
