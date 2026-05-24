import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the workstation title and readable mode tabs", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "字符画工作台" })).not.toBeNull();
    expect(screen.getByRole("button", { name: /图片 \/ GIF/ })).not.toBeNull();
    expect(screen.getByRole("button", { name: /视频/ })).not.toBeNull();
    expect(screen.getByRole("button", { name: /文字/ })).not.toBeNull();
    expect(screen.queryByText(/瀛|鍥|瑙|鏂/)).toBeNull();
  });
});
