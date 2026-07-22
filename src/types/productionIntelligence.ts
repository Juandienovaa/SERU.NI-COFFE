import { ProductionBatch } from "./productionBatch";

export interface BatchItemRecord {
  id: string;
  batch_id: string;
  product_id: number;
  product_name: string;
  quantity_produced: number;
  created_at: string;
  status?: "✔ Added to Inventory" | "Pending Reconciliation";
  health?: "Healthy" | "Low Stock Prevention" | "Attention";
}

export interface TimelineEvent {
  id: string;
  title: string;
  subtitle?: string;
  timestamp: string;
  iconType: "Create" | "Start" | "Produce" | "Defect" | "Complete" | "Supervisor" | "Quality";
  status: "completed" | "in-progress" | "pending";
}

export interface ProductionValidationResult {
  isValid: boolean;
  rawCups: number;
  finishedCups: number;
  defectCups: number;
  variance: number;
  formulaText: string;
}

export interface ProductionQualityMetrics {
  qualityScore: number;
  efficiencyScore: number;
  lossPercentage: number;
  yieldPercentage: number;
  statusLevel: "Excellent" | "Good" | "Needs Attention";
  badgeColor: string;
}

export interface ManagerInsightItem {
  id: string;
  type: "positive" | "warning" | "neutral" | "recommendation";
  text: string;
}

export interface ProductionIntelligenceData {
  batch: ProductionBatch;
  items: BatchItemRecord[];
  timeline: TimelineEvent[];
  validation: ProductionValidationResult;
  quality: ProductionQualityMetrics;
  insights: ManagerInsightItem[];
  durationMinutes: number;
  speedCupsPerMin: number;
  location: string;
}
