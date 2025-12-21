# AI Template Generation Roadmap

This plan outlines the strategy for implementing "AI Layering" and "Element Detection" to automate template creation from existing ID card images.

## 核心目标 (Core Objectives)

1. **自动图层分离 (Auto-Layering)**: Separate a flat image into a clean background (inpainted) and individual asset layers (logos, photos).
2. **元素智能识别 (Element Detection)**: Automatically detect text fields, photos, and QR codes with their coordinates and attributes.
3. **一键模板生成 (One-Click Synthesis)**: Convert an uploaded image directly into a production-ready `.json` template.

---

## 路线图 (Roadmap)

### 第一阶段: AI 视觉基建 (AI Vision Foundation)
- [ ] **Vision API Integration**: Set up a server-side proxy to a Vision LLM (e.g., GPT-4o or Claude 3.5) optimized for bounding-box detection.
- [ ] **Segment & Inpaint Pipeline**: Integrate a service (e.g., SAM + LaMa) to extract foreground elements and "heal" the background image.

### 第二阶段: 管理端魔法工具 (Admin "Magic" Tools)
- [ ] **Layering Wizard (`/admin/ai-layering`)**:
  - UI for uploading a sample ID.
  - Progress view for AI processing (Detection -> Segmentation -> Inpainting).
  - Interactive "Correction Mode" where users can refine bounding boxes.
- [ ] **Schema Mapping Engine**:
  - Logic to map detected "Name" text to `variableName: "full_name"`.
  - Logic to map photo boxes to `type: "photo"` with correct aspect ratios.

### 第三阶段: 自动化增强 (Automation Polish)
- [ ] **Font Matching**: AI suggests the closest Google Font based on the visual appearance of detected text.
- [ ] **Color Extraction**: Automatically set `color` and `backgroundColor` based on the dominant colors in specific regions.

---

## 技术方案建议 (Technical Suggestions)

### 1. Element Detection (The "Long Shot")
Use a **Vision LLM** with a specific system prompt:
> "Analyze this ID card and return a JSON array of objects with: `type` (text|photo|qr|logo), `label` (e.g. 'First Name'), `bbox` [x, y, w, h], and `style` (fontSize, fontFamily)."

### 2. Layer Separation
1. **Detection**: Identify regions.
2. **Masking**: Create alpha masks for detected regions.
3. **Inpainting**: Use a model like **Stable Diffusion Inpainting** or **LaMa** to fill the holes left behind in the background.

---

> [!TIP]
> **Priority Recommendation**: Start with **Element Detection** first. Even without the background layering, being able to auto-place text boxes on top of a flat image saves 80% of the manual work.
