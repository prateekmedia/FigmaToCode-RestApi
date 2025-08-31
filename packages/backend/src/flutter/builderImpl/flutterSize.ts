import { nodeSize } from "../../common/nodeWidthHeight";
import { numberToFixedString } from "../../common/numToAutoFixed";

// Used in tests.
export const flutterSizeWH = (node: SceneNode): string => {
  const fSize = flutterSize(node);
  const size = fSize.width + fSize.height;
  return size;
};

export const flutterSize = (
  node: SceneNode,
): {
  width: string;
  height: string;
  isExpanded: boolean;
  constraints: Record<string, string>;
} => {
  const size = nodeSize(node);
  let isExpanded: boolean = false;

  // Check if node has rotation and will get Matrix4 transform
  // If so, we need to "undo" Figma's dimension adjustment to get original pre-rotation dimensions
  const rotation = (node as any).rotation || 0;
  const hasRotation = Math.abs(rotation) > 0.01;
  const is90DegreeRotation = Math.abs(rotation - Math.PI / 2) < 0.1 || Math.abs(rotation - 3 * Math.PI / 2) < 0.1;
  
  
  let finalWidth = size.width;
  let finalHeight = size.height;
  
  // For 90/270 degree rotations, Figma swaps dimensions but Flutter transform needs original dimensions
  if (hasRotation && is90DegreeRotation && typeof size.width === "number" && typeof size.height === "number") {
    finalWidth = size.height;  // Swap back to original
    finalHeight = size.width;  // Swap back to original
  }

  const nodeParent = node.parent;

  // this cast will always be true, since nodeWidthHeight was called with false to relative.
  let propWidth = "";
  if (typeof finalWidth === "number") {
    propWidth = numberToFixedString(finalWidth);
  } else if (finalWidth === "fill") {
    // When parent is a Row, child must be Expanded.
    if (
      nodeParent &&
      "layoutMode" in nodeParent &&
      nodeParent.layoutMode === "HORIZONTAL"
    ) {
      isExpanded = true;
    } else {
      propWidth = `double.infinity`;
    }
  }

  let propHeight = "";
  if (typeof finalHeight === "number") {
    propHeight = numberToFixedString(finalHeight);
  } else if (finalHeight === "fill") {
    // When parent is a Column, child must be Expanded.
    if (
      nodeParent &&
      "layoutMode" in nodeParent &&
      nodeParent.layoutMode === "VERTICAL"
    ) {
      isExpanded = true;
    } else {
      propHeight = `double.infinity`;
    }
  }

  // Handle min/max constraints
  const constraints: Record<string, string> = {};

  if (node.minWidth !== undefined && node.minWidth !== null) {
    constraints.minWidth = numberToFixedString(node.minWidth);
  }

  if (node.maxWidth !== undefined && node.maxWidth !== null) {
    constraints.maxWidth = numberToFixedString(node.maxWidth);
  }

  if (node.minHeight !== undefined && node.minHeight !== null) {
    constraints.minHeight = numberToFixedString(node.minHeight);
  }

  if (node.maxHeight !== undefined && node.maxHeight !== null) {
    constraints.maxHeight = numberToFixedString(node.maxHeight);
  }

  return { width: propWidth, height: propHeight, isExpanded, constraints };
};
