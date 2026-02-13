"""
LandWatch - Image Processing Module
Performs change detection between reference allotment maps and current satellite/drone imagery.
"""
import cv2
import numpy as np
import base64
import uuid


def read_image_from_bytes(file_bytes: bytes) -> np.ndarray:
    """Convert uploaded file bytes to OpenCV image."""
    nparr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img


def resize_to_match(ref: np.ndarray, cur: np.ndarray) -> tuple:
    """Resize current image to match reference dimensions."""
    h, w = ref.shape[:2]
    cur_resized = cv2.resize(cur, (w, h), interpolation=cv2.INTER_AREA)
    return ref, cur_resized


def image_to_base64(img: np.ndarray) -> str:
    """Convert OpenCV image to base64 string for JSON transport."""
    _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return base64.b64encode(buffer).decode('utf-8')


def classify_deviation(ref, cur, contour, x, y, w, h):
    """Classify the type of deviation detected based on pixel intensity analysis."""
    roi_ref = ref[y:y+h, x:x+w]
    roi_cur = cur[y:y+h, x:x+w]

    ref_gray = cv2.cvtColor(roi_ref, cv2.COLOR_BGR2GRAY) if len(roi_ref.shape) == 3 else roi_ref
    cur_gray = cv2.cvtColor(roi_cur, cv2.COLOR_BGR2GRAY) if len(roi_cur.shape) == 3 else roi_cur

    ref_mean = np.mean(ref_gray)
    cur_mean = np.mean(cur_gray)
    ref_std = np.std(ref_gray)
    cur_std = np.std(cur_gray)

    # Bright → Dark: new construction on open land
    if ref_mean > 180 and cur_mean < 150:
        return "Possible Encroachment/Construction"
    # Dark → Bright: demolition or clearing
    elif ref_mean < 120 and cur_mean > 160:
        return "Possible Demolition/Clearing"
    # Texture change: different land use
    elif abs(ref_std - cur_std) > 25:
        return "Land Use Change Detected"
    # Significant intensity shift: unauthorized activity
    elif abs(ref_mean - cur_mean) > 40:
        return "Unauthorized Development"
    # Moderate change
    elif abs(ref_mean - cur_mean) > 20:
        return "Boundary Deviation"
    else:
        return "Minor Surface Change"


def compute_severity(area_pixels, total_area, intensity):
    """Compute deviation severity based on area, proportion, and intensity."""
    proportion = area_pixels / max(total_area, 1) * 100
    if proportion > 5 or intensity > 80:
        return "Critical"
    elif proportion > 2 or intensity > 60:
        return "High"
    elif proportion > 0.5 or intensity > 40:
        return "Medium"
    else:
        return "Low"


def compute_difference(reference: np.ndarray, current: np.ndarray) -> dict:
    """
    Compare reference map with current satellite image.
    Returns comprehensive change detection analysis with visualizations.
    """
    # Ensure same size
    reference, current = resize_to_match(reference, current)
    h, w = reference.shape[:2]
    total_area = h * w

    # Convert to grayscale
    ref_gray = cv2.cvtColor(reference, cv2.COLOR_BGR2GRAY)
    cur_gray = cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian blur to reduce noise
    ref_blur = cv2.GaussianBlur(ref_gray, (5, 5), 0)
    cur_blur = cv2.GaussianBlur(cur_gray, (5, 5), 0)

    # Compute absolute difference
    diff = cv2.absdiff(ref_blur, cur_blur)

    # Threshold to get binary mask of significant changes
    _, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)

    # Morphological operations to clean up noise
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

    # Find contours of changed regions
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filter small contours (noise)
    min_area = total_area * 0.001  # 0.1% of image
    significant_contours = [c for c in contours if cv2.contourArea(c) > min_area]

    # -- Generate visual outputs --

    # 1. Overlay: highlight changes on the current image in red
    overlay = current.copy()
    mask = np.zeros_like(ref_gray)
    cv2.drawContours(mask, significant_contours, -1, 255, -1)
    overlay[mask > 0] = [0, 0, 255]  # Red overlay
    overlay = cv2.addWeighted(current, 0.6, overlay, 0.4, 0)
    # Draw contour outlines
    cv2.drawContours(overlay, significant_contours, -1, (0, 0, 255), 2)

    # 2. Heatmap: intensity-based visualization of change magnitude
    heatmap = cv2.applyColorMap(diff, cv2.COLORMAP_JET)
    heatmap = cv2.addWeighted(current, 0.5, heatmap, 0.5, 0)

    # 3. Difference mask: binary black/white
    diff_colored = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)

    # 4. Annotated reference: reference image with deviation boxes
    annotated_ref = reference.copy()
    for i, contour in enumerate(significant_contours):
        x, y, bw, bh = cv2.boundingRect(contour)
        cv2.rectangle(annotated_ref, (x, y), (x + bw, y + bh), (0, 255, 0), 2)
        cv2.putText(annotated_ref, f"D{i+1}", (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    # 5. Annotated current: current image with deviation boxes
    annotated_cur = current.copy()
    for i, contour in enumerate(significant_contours):
        x, y, bw, bh = cv2.boundingRect(contour)
        cv2.rectangle(annotated_cur, (x, y), (x + bw, y + bh), (0, 0, 255), 2)
        cv2.putText(annotated_cur, f"D{i+1}", (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

    # -- Classify each deviation --
    deviations = []
    for i, contour in enumerate(significant_contours):
        x, y, bw, bh = cv2.boundingRect(contour)
        area_px = cv2.contourArea(contour)
        roi_diff = diff[y:y+bh, x:x+bw]
        avg_intensity = float(np.mean(roi_diff))
        dev_type = classify_deviation(reference, current, contour, x, y, bw, bh)
        severity = compute_severity(area_px, total_area, avg_intensity)

        deviations.append({
            "id": f"D{i+1}",
            "type": dev_type,
            "severity": severity,
            "area_pixels": int(area_px),
            "area_percentage": round(area_px / total_area * 100, 3),
            "bbox": {"x": int(x), "y": int(y), "width": int(bw), "height": int(bh)},
            "avg_change_intensity": round(avg_intensity, 1),
        })

    # Sort by severity
    severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    deviations.sort(key=lambda d: severity_order.get(d["severity"], 4))

    # Summary stats
    changed_pixels = int(np.count_nonzero(thresh))
    change_pct = round(changed_pixels / total_area * 100, 2)
    risk_level = "Low"
    if any(d["severity"] == "Critical" for d in deviations) or change_pct > 10:
        risk_level = "Critical"
    elif any(d["severity"] == "High" for d in deviations) or change_pct > 5:
        risk_level = "High"
    elif any(d["severity"] == "Medium" for d in deviations) or change_pct > 2:
        risk_level = "Medium"

    result_id = str(uuid.uuid4())[:8].upper()

    return {
        "result_id": result_id,
        "images": {
            "overlay": image_to_base64(overlay),
            "heatmap": image_to_base64(heatmap),
            "difference": image_to_base64(diff_colored),
            "annotated_reference": image_to_base64(annotated_ref),
            "annotated_current": image_to_base64(annotated_cur),
        },
        "deviations": deviations,
        "summary": {
            "total_deviations": len(deviations),
            "changed_area_pixels": changed_pixels,
            "total_area_pixels": total_area,
            "change_percentage": change_pct,
            "risk_level": risk_level,
            "image_dimensions": f"{w}x{h}",
        },
    }
