import React, { Suspense } from "react";
import { motion } from "framer-motion";

// ═══════════════════════════════════════════════
// GenUI Renderer — Dynamic Component Mapper
// The AI backend sends a JSON schema, this renders it
// ═══════════════════════════════════════════════

// Lazy load all possible GenUI components
const componentRegistry: Record<string, React.LazyExoticComponent<any>> = {
  HealthScoreGauge: React.lazy(() => import("./HealthScoreGauge")),
  ShapWaterfall: React.lazy(() => import("./ShapWaterfall")),
  StressTestSimulator: React.lazy(() => import("./StressTestSimulator")),
  FireTrajectoryChart: React.lazy(() => import("./FireTrajectoryChart")),
  TaxOptimizationCard: React.lazy(() => import("./TaxOptimizationCard")),
  DebtAvalancheModule: React.lazy(() => import("./DebtAvalancheModule")),
  ActionableCards: React.lazy(() => import("./ActionableCards")),
};

export interface GenUIComponent {
  type: string;
  priority: "low" | "medium" | "high";
  props: Record<string, any>;
}

export interface GenUISchema {
  layout: "adaptive" | "grid" | "focus";
  components: GenUIComponent[];
}

const priorityWeight = (p: string) =>
  ({ high: 3, medium: 2, low: 1 }[p] || 0);

// Skeleton loader for lazy components
const ComponentSkeleton = ({ type }: { type: string }) => (
  <div className="account-card rounded-lg p-6 animate-pulse">
    <div className="h-4 w-32 bg-muted rounded mb-4" />
    <div className="h-32 bg-muted/50 rounded" />
    <div className="mt-3 h-3 w-48 bg-muted/30 rounded" />
  </div>
);

export const GenUIRenderer: React.FC<{ schema: GenUISchema }> = ({ schema }) => {
  // Sort by priority — high first
  const sortedComponents = [...(schema.components || [])].sort(
    (a, b) => priorityWeight(b.priority) - priorityWeight(a.priority)
  );

  return (
    <div className="space-y-6">
      {/* GenUI header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-xs font-body tracking-[0.2em] uppercase text-muted-foreground">
          Generative UI — {sortedComponents.length} components dynamically assembled
        </span>
      </motion.div>

      {/* Render components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedComponents.map((component, index) => {
          const Component = componentRegistry[component.type];

          if (!Component) {
            console.warn(`[GenUI] Unknown component type: ${component.type}`);
            return null;
          }

          // Full-width for high priority or specific components
          const isFullWidth = component.priority === "high" ||
            ["ShapWaterfall", "StressTestSimulator", "FireTrajectoryChart", "ActionableCards"].includes(component.type);

          return (
            <motion.div
              key={`${component.type}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={isFullWidth ? "lg:col-span-2" : ""}
            >
              <Suspense fallback={<ComponentSkeleton type={component.type} />}>
                <Component {...component.props} />
              </Suspense>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GenUIRenderer;
