import { Size } from "types";

export const nodeSize = (node: SceneNode): Size => {
  // Always prioritize explicit width/height dimensions over layout sizing
  // This ensures the REST API dimensions are preserved
  if (node.width !== undefined && node.height !== undefined) {
    // For root frames or frames with explicit dimensions, always use them
    if (!(node as any).parent || !("layoutSizingHorizontal" in node)) {
      return { width: node.width, height: node.height };
    }
  }

  if ("layoutSizingHorizontal" in node && "layoutSizingVertical" in node) {
    const width =
      node.layoutSizingHorizontal === "FILL"
        ? "fill"
        : node.layoutSizingHorizontal === "HUG"
          ? null
          : node.width;

    const height =
      node.layoutSizingVertical === "FILL"
        ? "fill"
        : node.layoutSizingVertical === "HUG"
          ? null
          : node.height;

    return { width, height };
  }

  return { width: node.width, height: node.height };
};
