# Stage Background Assets

## Format
PNG or JPG. Recommended: 1080×1920 (portrait), compressed to <500KB each.

## One image per spiritual stage

```
assets/backgrounds/stage/
  baby.png     ← warm stone/earth, soft village, golden light
  child.png    ← wider horizon, gentle path, open sky
  teen.png     ← city/learning environment, movement
  young.png    ← mission field, open road
  adult.png    ← symbolic, mature, luminous
```

## Current status
Only baby.png is needed for the MVP demo.
The others can be solid color gradients as placeholders until designed.

## Source recommendation
- Generate with Midjourney/Stable Diffusion: "biblical village background, warm golden light,
  stone path, soft bokeh, cinematic, mobile app background, no characters, 9:16"
- Or use a warm gradient (#1a0f2e → #3d2b1f) as fallback (already handled in code)
