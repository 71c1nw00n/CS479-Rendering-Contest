import os
import argparse

parser = argparse.ArgumentParser()

input_group = parser.add_mutually_exclusive_group(required=True)
input_group.add_argument("--prompt", type=str, help="Text prompt (text mode)")
input_group.add_argument("--image", type=str, help="Input image path (image mode)")

parser.add_argument("--output", type=str, default="output")
parser.add_argument("--seed", type=int, default=None)
parser.add_argument("--model", type=str, choices=["large", "xlarge"], default=None,
                    help="Model size (default: large)")
parser.add_argument("--spconv-algo", type=str, default="implicit_gemm",
                    choices=["native", "implicit_gemm", "auto"])
parser.add_argument("--steps", type=int, default=None,
                    help="Sampler steps (default: image=12, text=20)")
parser.add_argument("--cfg-strength", type=float, default=None,
                    help="Sparse structure CFG strength (default: image=7.5, text=6.5)")
parser.add_argument("--slat-cfg-strength", type=float, default=None,
                    help="Slat sampler CFG strength (default: image=3.0, text=same as --cfg-strength)")
parser.add_argument("--simplify", type=float, default=None,
                    help="Mesh simplification ratio (default: image=0.95, text=0.98)")
parser.add_argument("--texture-size", type=int, default=None,
                    help="Texture size for GLB (default: image=1024, text=512)")
parser.add_argument("--num-frames", type=int, default=120,
                    help="Number of frames in output video (default: 120)")
args = parser.parse_args()

os.environ['SPCONV_ALGO'] = args.spconv_algo

import imageio
import torch
from PIL import Image
from trellis.pipelines import TrellisImageTo3DPipeline, TrellisTextTo3DPipeline
from trellis.utils import render_utils, postprocessing_utils

mode = "image" if args.image else "text"

# Mode-specific defaults
model        = args.model or "large"
if mode == "image":
    steps        = args.steps          if args.steps          is not None else 12
    cfg          = args.cfg_strength   if args.cfg_strength   is not None else 7.5
    slat_cfg     = args.slat_cfg_strength if args.slat_cfg_strength is not None else 3.0
    simplify     = args.simplify       if args.simplify       is not None else 0.95
    texture_size = args.texture_size   if args.texture_size   is not None else 1024
else:
    steps        = args.steps          if args.steps          is not None else 20
    cfg          = args.cfg_strength   if args.cfg_strength   is not None else 6.5
    slat_cfg     = args.slat_cfg_strength if args.slat_cfg_strength is not None else cfg
    simplify     = args.simplify       if args.simplify       is not None else 0.98
    texture_size = args.texture_size   if args.texture_size   is not None else 512

print(f"[INFO] mode={mode}, model={model}, steps={steps}, cfg={cfg}, slat_cfg={slat_cfg}, simplify={simplify}, texture_size={texture_size}")

if mode == "image":
    pipeline = TrellisImageTo3DPipeline.from_pretrained(f"microsoft/TRELLIS-image-{model}")
else:
    pipeline = TrellisTextTo3DPipeline.from_pretrained(f"microsoft/TRELLIS-text-{model}")
pipeline.cuda()

seeds = [args.seed] if args.seed is not None else [2, 5, 8, 13, 21]
last_error = None
for seed in seeds:
    try:
        print(f"[INFO] Generating with seed={seed}")
        torch.cuda.empty_cache()

        if mode == "image":
            inp = Image.open(args.image)
            outputs = pipeline.run(
                inp,
                seed=seed,
                sparse_structure_sampler_params={"steps": steps, "cfg_strength": cfg},
                slat_sampler_params={"steps": steps, "cfg_strength": slat_cfg},
            )
        else:
            outputs = pipeline.run(
                args.prompt,
                seed=seed,
                formats=["mesh", "gaussian"],
                sparse_structure_sampler_params={"steps": steps, "cfg_strength": cfg},
                slat_sampler_params={"steps": steps, "cfg_strength": slat_cfg},
            )

        glb = postprocessing_utils.to_glb(
            outputs['gaussian'][0],
            outputs['mesh'][0],
            simplify=simplify,
            texture_size=texture_size,
        )
        glb.export(f"{args.output}.glb")
        video = render_utils.render_video(outputs['gaussian'][0], num_frames=args.num_frames)['color']
        imageio.mimsave(f"{args.output}.mp4", video, fps=30)
        print(f"[INFO] Saved {args.output}.glb")
        print(f"[INFO] Saved {args.output}.mp4")
        break
    except RuntimeError as e:
        if "out of memory" not in str(e).lower():
            raise
        last_error = e
        print(f"[WARNING] seed={seed} OOM; trying next seed.")
        torch.cuda.empty_cache()
else:
    raise RuntimeError("Could not generate within available GPU memory.") from last_error
