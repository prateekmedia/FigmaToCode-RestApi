import { AltNode } from "../../alt_api_types";
import {
  generateWidgetCode,
  numberToFixedString,
} from "../../common/numToAutoFixed";

/**
 * https://api.flutter.dev/flutter/widgets/Opacity-class.html
 */
export const flutterOpacity = (
  node: MinimalBlendMixin,
  child: string,
): string => {
  if (node.opacity !== undefined && node.opacity !== 1 && child !== "") {
    return generateWidgetCode("Opacity", {
      opacity: numberToFixedString(node.opacity),
      child: child,
    });
  }
  return child;
};

/**
 * https://api.flutter.dev/flutter/widgets/Visibility-class.html
 */
export const flutterVisibility = (node: SceneNode, child: string): string => {
  // [when testing] node.visible can be undefined

  if (node.visible !== undefined && !node.visible && child !== "") {
    return generateWidgetCode("Visibility", {
      visible: `${node.visible}`,
      child: child,
    });
  }
  return child;
};

/**
 * https://api.flutter.dev/flutter/widgets/Transform-class.html
 * that's how you convert angles to clockwise radians: angle * -pi/180
 */
export const flutterRotation = (node: AltNode, child: string): string => {
  if (
    node.rotation !== undefined &&
    child !== "" &&
    Math.round(node.rotation) !== 0
  ) {
    const matrix = generateRotationMatrix(node);
    if (matrix) {
      return generateWidgetCode("Transform", {
        transform: matrix,
        child: child,
      });
    }
  }
  return child;
};

/**
 * Generates a rotation matrix string for Flutter transforms
 */
export const generateRotationMatrix = (node: AltNode): string => {
  let rotation = (node.rotation || 0) + (node.cumulativeRotation || 0);

  if (Math.abs(rotation) < 0.01) {
    return "";
  }

  // Figma provides rotation in radians, not degrees
  // So we use the rotation value directly without conversion
  const rotationInRadians = rotation;
  const halfPi = Math.PI / 2;
  
  // Check if rotation is close to 90, 180, 270, or 360 degrees
  const normalizedRotations = [0, halfPi, Math.PI, 3 * halfPi, 2 * Math.PI];
  for (const targetRotation of normalizedRotations) {
    if (Math.abs(rotationInRadians - targetRotation) < 0.2) {
      if (targetRotation === 0 || targetRotation === 2 * Math.PI) {
        return "";
      }
      return `Matrix4.identity()..translate(0.0, 0.0)..rotateZ(${numberToFixedString(targetRotation)})`;
    }
  }

  // For non-standard rotations, use the rotation value directly (already in radians)
  return `Matrix4.identity()..translate(0.0, 0.0)..rotateZ(${numberToFixedString(rotationInRadians)})`;
};
