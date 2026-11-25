import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const phone = vi.hoisted(() => ({ value: false }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/user/test-op",
}));
vi.mock("@/components/live/fonts", () => ({ lbwFontVars: "" }));
vi.mock("@/components/board-mobile/usePhone", () => ({ usePhone: () => phone.value }));
vi.mock("@/components/live/WatchButton", () => ({ WatchButton: () => null }));
vi.mock("@/components/profile-v2/MyWatchlist", () => ({ MyWatchlist: () => null }));
vi.mock("@/components/share/ArtworkShareControls", () => ({ ArtworkShareControls: () => null }));

import { ProfileWorkspace } from "@/components/profile-v2/ProfileWorkspace";

afterEach(cleanup);

describe("/user/* heading structure", () => {
  for (const [label, isPhone] of [["desktop", false], ["phone", true]] as const) {
    it(`renders exactly one h1 (the shell title) on ${label}`, () => {
      phone.value = isPhone;
      const { container } = render(
        <ProfileWorkspace name="Test Op" codename="test-op" rank={3} tier="Tier" platform="claude" yieldLabel="1.0" actions={null}>
          <p>body</p>
        </ProfileWorkspace>,
      );
      const h1s = container.querySelectorAll("h1");
      expect(h1s.length).toBe(1);
      expect(h1s[0].textContent).toContain("PROFILE / Test Op");
      expect(container.querySelector(".ws-pm-names h2")?.textContent).toBe("Test Op");
    });
  }
});
