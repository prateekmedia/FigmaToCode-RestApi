import {
  flutterVisibility,
  flutterOpacity,
  flutterRotation,
} from "./builderImpl/flutterBlend";

import { flutterContainer } from "./flutterContainer";
import {
  commonIsAbsolutePosition,
  getCommonPositionValue,
} from "../common/commonPosition";
import { generateWidgetCode } from "../common/numToAutoFixed";

export class FlutterDefaultBuilder {
  child: string;
  rotationApplied: boolean = false;

  constructor(optChild: string) {
    this.child = optChild;
  }

  createContainer(node: SceneNode): this {
    this.child = flutterContainer(node, this.child);
    this.rotationApplied = true;

    return this;
  }

  blendAttr(node: SceneNode): this {
    // Only apply rotation via Transform if it wasn't already handled in the container
    if ("rotation" in node && !this.rotationApplied) {
      this.child = flutterRotation(node as any, this.child);
    }

    if ("visible" in node) {
      this.child = flutterVisibility(node as any, this.child);
    } else if ("opacity" in node) {
      this.child = flutterOpacity(node as any, this.child);
    }
    return this;
  }

  position(node: SceneNode): this {
    const isCommonAbsolute = commonIsAbsolutePosition(node);
    const shouldUseCustom = this.shouldUseAbsolutePositioning(node);
    
    // Apply positioning when appropriate
    if (isCommonAbsolute) {
      const { x, y } = getCommonPositionValue(node);
      this.child = generateWidgetCode("Positioned", {
        left: x,
        top: y,
        child: this.child,
      });
    } else if (shouldUseCustom) {
      // Use absoluteBoundingBox for Stack children that need positioning
      const position = this.getRelativePosition(node);
      if (position) {
        this.child = generateWidgetCode("Positioned", {
          left: position.left,
          top: position.top,
          child: this.child,
        });
      }
    }
    return this;
  }

  private shouldUseAbsolutePositioning(node: SceneNode): boolean {
    // Find the immediate Stack parent for this node
    const stackParent = this.findImmediateStackParent(node);
    return !!stackParent;
  }

  private findImmediateStackParent(node: SceneNode): any | null {
    const parent = (node as any).parent;
    if (!parent) return null;
    
    // Check if parent will generate a Stack widget
    const willGenerateStack = this.willParentGenerateStack(parent);
    
    
    return willGenerateStack ? parent : null;
  }

  private willParentGenerateStack(parent: any): boolean {
    // Based on flutterMain.ts logic, Stack is used when:
    // 1. layoutMode is "NONE" 
    // 2. Has absolute positioned children
    // 3. Is root frame
    // 4. No layoutMode and no inferredAutoLayout
    // 5. layoutMode is "AUTO" (should prefer Stack)
    
    const hasAbsoluteChildren = parent.children && parent.children.some(
      (child: any) => child.layoutPositioning === "ABSOLUTE"
    );
    
    const isRootFrame = !parent.parent;
    const noLayoutMode = !parent.layoutMode || parent.layoutMode === "NONE";
    const noInferredLayout = !parent.inferredAutoLayout;
    const isAutoLayout = parent.layoutMode === "AUTO";
    
    // Also detect frames that currently generate Stack in output (like Frame 1412769182)
    const shouldUseStack = noLayoutMode || hasAbsoluteChildren || (isRootFrame && noInferredLayout) || isAutoLayout;
    
    
    return shouldUseStack;
  }

  private getRelativePosition(node: SceneNode): { left: number, top: number } | null {
    const absoluteBounds = (node as any).absoluteBoundingBox;
    if (!absoluteBounds) return null;
    
    // Find immediate Stack parent
    const stackParent = this.findImmediateStackParent(node);
    if (!stackParent) return null;
    
    const parentBounds = stackParent.absoluteBoundingBox;
    if (!parentBounds) return null;
    
    // Calculate position relative to immediate Stack parent
    const relativeLeft = absoluteBounds.x - parentBounds.x;
    const relativeTop = absoluteBounds.y - parentBounds.y;
    
    
    return { left: relativeLeft, top: relativeTop };
  }

  positionInStack(node: SceneNode, stackContext: { absoluteBoundingBox: any, name: string }): this {
    const nodeBounds = (node as any).absoluteBoundingBox;
    if (!nodeBounds || !stackContext.absoluteBoundingBox) {
      return this;
    }

    // Calculate relative position within Stack parent
    const relativeLeft = nodeBounds.x - stackContext.absoluteBoundingBox.x;
    const relativeTop = nodeBounds.y - stackContext.absoluteBoundingBox.y;


    // Apply Positioned wrapper
    this.child = generateWidgetCode("Positioned", {
      left: relativeLeft,
      top: relativeTop,
      child: this.child,
    });

    return this;
  }
}
