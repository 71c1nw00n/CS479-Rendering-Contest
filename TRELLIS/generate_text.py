import os
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--prompt", type=str, required=True)
parser.add_argument("--output", type=str, default="output")
parser.add_argument("--seed", type=int, default=None)
parser.add_argument("--model", type=str, default="large", choices=["large", "xlarge"],
                    help="Model size: large or xlarge (default: large)")
parser.add_argument("--spconv-algo", type=str, default="implicit_gemm",
                    choices=["native", "implicit_gemm", "auto"],
                    help="SPCONV algorithm (default: implicit_gemm)")
parser.add_argument("--steps", type=int, default=20,
                    help="Sampler steps (default: 20)")
parser.add_argument("--cfg-strength", type=float, default=6.5,
                    help="CFG strength (default: 6.5)")
parser.add_argument("--simplify", type=float, default=0.98,
                    help="Mesh simplification ratio (default: 0.98)")
parser.add_argument("--texture-size", type=int, default=512,
                    help="Texture size for GLB (default: 512)")
args = parser.parse_args()

os.environ['SPCONV_ALGO'] = args.spconv_algo

import imageio
import torch
from trellis.pipelines import TrellisTextTo3DPipeline
from trellis.utils import render_utils, postprocessing_utils

pipeline = TrellisTextTo3DPipeline.from_pretrained(f"microsoft/TRELLIS-text-{args.model}")
pipeline.cuda()

seeds = [args.seed] if args.seed is not None else [2, 5, 8, 13, 21]
last_error = None
for seed in seeds:
    try:
        print(f"[INFO] Generating with seed={seed}")
        torch.cuda.empty_cache()
        outputs = pipeline.run(
            args.prompt,
            seed=seed,
            formats=["mesh", "gaussian"],
            sparse_structure_sampler_params={"steps": args.steps, "cfg_strength": args.cfg_strength},
            slat_sampler_params={"steps": args.steps, "cfg_strength": args.cfg_strength},
        )
        glb = postprocessing_utils.to_glb(
            outputs['gaussian'][0],
            outputs['mesh'][0],
            simplify=args.simplify,
            texture_size=args.texture_size,
        )
        glb.export(f"{args.output}.glb")
        video = render_utils.render_video(outputs['gaussian'][0], num_frames=120)['color']
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
