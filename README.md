<div align="center">
<img src="./logo.png" alt="To 3DML and Beyond!" width="600">
</div>

# 🚀 To 3DML and Beyond! 

**[Team 18] CS479: Machine Learning for 3D Data — 3D Rendering Contest**
KAIST, Spring 2026 · Prof. Minhyuk Sung

| Name | Student ID |
|---|---|
| **Minjun Youn** | `20210410` |
| **Chaewoon Ki** | `20220049` |

</div>

---

## Demo

https://github.com/71c1nw00n/CS479-Rendering-Contest/raw/main/real_room_camera_render_fixed60.mp4

<details>
<summary>Video not playing? Open it directly</summary>

- ▶️ [`real_room_camera_render_fixed60.mp4`](./real_room_camera_render_fixed60.mp4) (mp4, 60fps)
- ▶️ [`real_room_camera_render.webm`](./real_room_camera_render.webm) (webm)

</details>

---

## Overview

The contest offers three ways to produce 3D content — reconstructing a scene from real-world images, handcrafting a model, or generating it with neural models. Instead of picking one, **we combined all three** into a single scene and built a story around that idea.

In **To 3DML and Beyond!**, walking into our CS479 lecture room transports us into Andy's room from *Toy Story*. The video starts in the hallway outside the 3DML classroom, passes through the classroom door, and instead of the lecture room we find ourselves inside Andy's room, with the toy characters moving around. As the camera turns to light them up, they freeze — realizing they are being watched.

Each part of the scene was made with a different technique:

| Stage | Content | Technique |
|---|---|---|
| 🏫 3DML Classroom | Real-world reconstruction | Nerfstudio (Nerfacto) → colored point cloud |
| 🛏️ Andy's Room | 3D scene generation | Blender (handcrafted shell) + TRELLIS (furniture & characters) |
| 🎬 Final Render | Combination & rendering | Three.js (WebGL) |

---

## Repository Structure

```
CS479-Rendering-Contest/
├── NeRF/                              # Classroom reconstruction (Nerfstudio)
│   ├── data/raw/                      # Raw capture video
│   ├── data/                         # Processed frames + camera poses (COLMAP)
│   ├── outputs/                      # Trained Nerfacto models
│   └── exports/                      # Exported colored point cloud (PLY)
├── TRELLIS/                          # Furniture & character generation
│   ├── generate.ipynb                # Reproduces all generated assets
│   └── assets/example_image/         # Reference images for image-to-3D
├── web/                              # Three.js renderer (final scene)
├── real_room_camera_render.webm      # Rendered output (webm)
└── real_room_camera_render_fixed60.mp4 # Rendered output (mp4, 60fps)
```

---

## Technical Aspects

### 1. 3DML Classroom — Real-World Reconstruction

The classroom was captured as a continuous video and processed with Nerfstudio's `ns-process-data` pipeline, which internally runs **COLMAP** for Structure-from-Motion — extracting **312 keyframes** and estimating per-frame camera poses. A **Nerfacto** model was trained for **30,000 iterations** with normal prediction enabled to improve surface geometry.

The trained NeRF volume was exported to a colored point cloud (PLY), then manually post-processed in Blender for trimming, repositioning, and filling. The final point cloud contains **1,958,914 points**, each with RGB color, alpha, and surface-normal attributes.

### 2. Andy's Room — Scene Generation

**Room shell (handcrafted).** A hollow 2 m × 2 m cube built in Blender, with normals flipped inward. Surfaces were covered with 2D image assets — the *Toy Story* cloud wallpaper on the walls and a Poly Haven laminate-wood texture on the floor. Texture scale and orientation were adjusted via the **Mapping node** in the Shader Editor.

**Furniture (generated).** All furniture was generated with **TRELLIS**, choosing the conditioning modality per object:
- **Text-to-3D** for simple, common pieces (bed, desk, drawer, chair) where a short prompt sufficed.
- **Image-to-3D** for geometrically complex or appearance-specific objects (globe, toy chest, slide, toy train), using a reference image.

Each asset was exported as `.glb` and imported into Blender for placement and scaling.

**Characters (generated).** Since pre-made 3D assets are not allowed, the four *Toy Story* characters (Woody, Jessie, Rex, Bullseye) were generated from 2D product photos via image-to-3D.

> ⚠️ **A practical TRELLIS challenge:** the model represents geometry on a fixed-resolution sparse voxel grid (64³). When a full-body figure is fed in at once, the face occupies too few voxels and comes out distorted. This was worst for Woody. We worked around it by **generating Woody's face separately** so it filled the grid and kept its detail, then reattaching the high-detail face to the body in Blender.

### 3. Combining & Rendering

The final render is a **Three.js webpage**. The reconstructed room (PLY point cloud) and the GLB assets are combined into one WebGL scene. Asset positions were laid out in Blender, then iteratively checked and adjusted in Three.js so the point cloud, room geometry, and toy models aligned.

The camera path was planned by simulating movement in Blender; Python scripts computed camera poses and route control points, which were transferred into Three.js as smooth **Catmull-Rom camera curves**. The render includes camera movement, target interpolation, and field-of-view zoom effects.

Small floating motions were added to the characters to make them feel alive. The scene also uses Three.js lighting, fog, tone mapping, and sRGB color output for visual quality. The project logo was made with Pixelframe's *Toy Story* font generator (a rule-based HTML Canvas tool, not AI image generation).

---

## Reproduction

### 1. 3DML Classroom (Nerfstudio)

```bash
# Step 1 — Process video: extract frames & recover camera poses (COLMAP SfM)
ns-process-data video \
  --data NeRF/data/raw/real_room_7.mp4 \
  --output-dir NeRF/data/real_room_7

# Step 2 — Train Nerfacto
ns-train nerfacto \
  --data NeRF/data/real_room_7 \
  --experiment-name real_room_7 \
  --max-num-iterations 30000

# Step 3 — Export point cloud
ns-export pointcloud \
  --load-config NeRF/outputs/real_room_7/nerfacto/<timestamp>/config.yml \
  --output-dir NeRF/exports/real_room_7_pointcloud
```

### 2. Andy's Room (TRELLIS + Blender)

Reproduction has two parts: **regenerating assets** (fully scripted) and **reassembling the room** in Blender (manual; the finished `.blend` file is provided).

**Asset generation (reproducible).** Set up the TRELLIS environment following the [official repository](https://github.com/microsoft/TRELLIS) — requires an NVIDIA GPU with **≥ 16 GB** memory. Reference images are included under `TRELLIS/assets/example_image/`, so the notebook runs directly:

```bash
# Run TRELLIS/generate.ipynb top to bottom
# - Text-to-3D for bed, desk, chair, drawer (prompts & params stored per cell)
# - Image-to-3D for globe, toy chest, train, slide, and characters
# Each cell writes a .glb mesh (+ preview .mp4) under the given output name.
```

**Room assembly (manual; file provided).** The room shell and final layout were built by hand in Blender and cannot be regenerated by script, so the complete Blender project is included. The manual steps were: create and hollow out a 2 m × 2 m cube → flip normals inward → apply wallpaper/floor textures and tune scale/orientation via the Mapping node → import each `.glb` and place/scale it. Opening the provided project reproduces the room as rendered.

### 3. Combining & Rendering (Three.js)

```bash
cd web
npm install
npm run dev
# Open the displayed URL in a browser.
# The page loads the point cloud and GLB assets, then starts the camera animation once everything is ready.
```

---

## Citations & Acknowledgments

**Models & Code**
- **[1]** Xiang, J., et al. (2025). *Structured 3D latents for scalable and versatile 3D generation.* CVPR 2025, 21469–21480. — [TRELLIS](https://doi.org/10.1109/cvpr52734.2025.02000)
- **[2]** Tancik, M., et al. (2023). *Nerfstudio: A modular framework for neural radiance field development.* SIGGRAPH 2023. — [Nerfstudio](https://doi.org/10.1145/3588432.3591516)
- **[3]** Three.js Authors (2026). *Three.js* (r184). — [GitHub](https://github.com/mrdoob/three.js)

**Image & Texture Assets**
- **[4]** luxojr888. *Toy Story Cloud Wallpaper.* [DeviantArt](https://www.deviantart.com/luxojr888/art/Toy-Story-Cloud-Wallpaper-808048773)
- **[5]** Poly Haven. *Laminate Floor 03.* [Poly Haven](https://polyhaven.com/a/laminate_floor_03)
- **[6]** BSHAPPLUS. *13" World Globe.* [Walmart](https://www.walmart.com/ip/894394465)
- **[7]** YOLOXO. *Collapsible Storage Box / Toy Organizer.* [Amazon](https://www.amazon.com/dp/B0BM88KCXG)
- **[8]** Green Toys. *Train, Blue (TRNB-1054).* [Amazon](https://www.amazon.com/dp/B00IL7IFP6)
- **[9]** Disney Store. *Woody Interactive Talking Action Figure.* [Amazon](https://www.amazon.com/dp/B07QTZ8238)
- **[10]** Disney Store. *Jessie Interactive Talking Action Figure.* [Amazon](https://www.amazon.com/dp/B07PN7FP76)
- **[11]** Disney Store. *Rex Interactive Talking Action Figure.* [Amazon](https://www.amazon.com/dp/B07PPB9DHN)
- **[12]** Disney Store. *Bullseye Figure.* [Amazon](https://www.amazon.com/dp/B0CHZB2JK8)
- **[13]** Step2. *Game Time Sports Climber with Slide.* [Amazon](https://www.amazon.com/dp/B00QZ2OQ8E)
- **[14]** Pixelframe Design. *Toy Story Font Generator.* [Pixelframe](https://pixelframe.design/toy-story-font-generator/)

> All code, models, and assets used are open-source / free / non-3D-geometry, in compliance with the contest rules. *Toy Story* and its characters are trademarks of Disney/Pixar; references above are used for academic, non-commercial purposes.
