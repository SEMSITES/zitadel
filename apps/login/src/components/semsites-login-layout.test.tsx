import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button, ButtonVariants } from "./button";
import { TextInput } from "./input";
import { SemsitesLoginLayout } from "./semsites-login-layout";

vi.mock("@/lib/theme-hooks", () => ({
  useThemeConfig: () => ({
    brandLayout: "full-split",
    brandName: "SEMSITES",
  }),
}));

describe("SemsitesLoginLayout", () => {
  it("keeps the fixed white form surface readable when the outer theme is dark", () => {
    const { getByLabelText, getByRole, getByText } = render(
      <SemsitesLoginLayout
        hasLeftRightStructure
        leftContent={null}
        rightContent={
          <>
            <TextInput label="Code" />
            <Button variant={ButtonVariants.Secondary}>Zurück</Button>
          </>
        }
      />,
    );

    expect(getByText("SEMSITES").className).toContain("text-white");
    expect(getByLabelText("Code").closest(".space-y-6")?.className).toContain("text-gray-950");
    expect(getByLabelText("Code").className).not.toContain("dark:text-white");
    expect(getByRole("button", { name: "Zurück" }).className).not.toContain("dark:text-white");
  });
});
