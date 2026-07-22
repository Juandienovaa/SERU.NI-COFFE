/**
 * Enterprise Product Design System Tokens (`DesignTokens.ts`).
 * Adheres strictly to Dark Mode only, Apple Business Apps, Shopify Admin, Linear, and SAP Fiori Modern.
 */

export const EnterpriseTokens = {
  colors: {
    background: "#09090B",
    surfaceSecondary: "#111113",
    surfaceCard: "#18181B",
    border: "rgba(255, 255, 255, 0.06)",
    borderHover: "rgba(255, 255, 255, 0.15)",
    primaryAccent: "#F97316", // Orange
    success: "#10B981", // Emerald
    warning: "#F59E0B", // Amber
    danger: "#F43F5E", // Rose
    info: "#0EA5E9", // Sky Blue
    textPrimary: "#FFFFFF",
    textSecondary: "#A3A3A3", // neutral-400
    textMuted: "#52525B" // neutral-600
  },
  radius: {
    card: "1.75rem", // rounded-3xl
    widget: "1.25rem", // rounded-2xl
    button: "1rem", // rounded-2xl / rounded-xl
    badge: "9999px" // rounded-full
  },
  shadows: {
    card: "0 20px 50px -12px rgba(0, 0, 0, 0.7)",
    accentHover: "0 20px 50px -12px rgba(249, 115, 22, 0.25)",
    glow: "0 0 40px rgba(249, 115, 22, 0.15)"
  },
  motion: {
    springFast: { type: "spring", stiffness: 400, damping: 30 },
    springSmooth: { type: "spring", stiffness: 260, damping: 25 },
    hoverCard: { y: -3, scale: 1.006 },
    tapCard: { scale: 0.994 }
  }
} as const;

export type EnterpriseTokensType = typeof EnterpriseTokens;
