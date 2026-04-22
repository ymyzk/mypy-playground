import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import Header from "./Header";
import { AppContext } from "./context";
import type { Context } from "./types";

const mockContext: Context = {
  defaultConfig: {
    mypyVersion: "v1",
    pythonVersion: "3.12",
    strict: false,
    warnReturnAny: false,
  },
  initialCode: "print('hi')",
  pythonVersions: ["3.12"],
  mypyVersions: [["v1", "v1"]],
  flags: ["strict", "warnReturnAny"],
  multiSelectOptions: {},
  gaTrackingId: null,
};

describe("Header", () => {
  test("renders mobile separators with aria-hidden", () => {
    render(
      <AppContext value={mockContext}>
        <Header
          config={mockContext.defaultConfig}
          status="ready"
          onGistClick={vi.fn()}
          onRunClick={vi.fn()}
          onConfigChange={vi.fn()}
        />
      </AppContext>,
    );

    const separators = screen.getAllByText("|");
    expect(separators).toHaveLength(4);
    separators.forEach((separator) => {
      expect(separator).toHaveAttribute("aria-hidden", "true");
    });
  });
});
