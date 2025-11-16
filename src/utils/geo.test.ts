import { describe, expect, it } from "vitest";
import { haversineDistance } from "./geo";

describe("haversineDistance", () => {
  it("calculates distance between two coordinates", () => {
    const distance = haversineDistance(-23.55052, -46.633308, -22.906847, -43.172897);
    expect(distance).toBeGreaterThan(300);
    expect(distance).toBeLessThan(400);
  });
});
