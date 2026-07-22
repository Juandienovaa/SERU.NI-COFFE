/**
 * Enterprise Inventory Intelligence Domain Models (`src/types/inventory.ts`).
 * Adheres to SAP Manufacturing, Oracle NetSuite, and Starbucks Operations WMS standards.
 */

export type InventoryStatusType =
  | "OVERSTOCK"
  | "HEALTHY"
  | "MEDIUM"
  | "LOW_STOCK"
  | "OUT_OF_STOCK";

export type ProductionPriorityLevel =
  | "HIGHEST"
  | "HIGH"
  | "NORMAL"
  | "SUFFICIENT";

export interface RawProductInventoryRecord {
  product_id: number;
  product_name: string;
  sku?: string;
  current_stock: number;
  minimum_stock: number;
  warning_stock: number;
  maximum_stock: number;
  recommended_production?: number;
  last_produced_at?: string | null;
  last_produced_by?: string | null;
  updated_at?: string;
}

export interface MRPRecommendation {
  recommendedCups: number;
  actionText: string;
  reason: string;
  priorityLevel: ProductionPriorityLevel;
}

export interface ProductInventoryItem extends RawProductInventoryRecord {
  statusLevel: InventoryStatusType;
  statusText: string;
  statusColorClass: string;
  badgeBgClass: string;
  badgeBorderClass: string;
  progressPercentage: number;
  priorityScore: number; // 0 - 100
  priorityLevel: ProductionPriorityLevel;
  priorityBadgeText: string;
  mrpRecommendation: MRPRecommendation;
  category?: "Coffee" | "Non-Coffee" | "Custom";
  unit?: string;
  image?: string;
}

export interface InventorySummaryStats {
  totalFinishedCups: number;
  totalProductsCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  mediumStockCount: number;
  healthyCount: number;
  overstockCount: number;
  lastSyncedAt: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T | null;
  error?: string | null;
}
