# Character Assets

## Format
All 3D character files must be `.glb` (binary glTF 2.0).  
FBX sources must be converted offline (Blender → File > Export > glTF 2.0 → GLB).

## Required files per character

Each character needs ONE .glb file that contains ALL animation clips embedded:

```
assets/character/
  baby_boy/
    spirit_baby_boy.glb        ← all 4 clips: idle, walk, celebrate, pray
  baby_girl/
    spirit_baby_girl.glb       ← all 4 clips: idle, walk, celebrate, pray
```

## Animation clip names inside the GLB
The clips MUST be named exactly:
- `idle`
- `walk`
- `celebrate`
- `pray`

## FBX → GLB conversion (Blender)
1. Import FBX: File > Import > FBX
2. If animations are split across files, import each and join NLA tracks
3. Export: File > Export > glTF 2.0
   - Format: GLB (binary)
   - Include: Armatures ✓, Animations ✓
   - Animation: NLA tracks ✓, All armature actions ✓

## Future characters (same pattern)
```
assets/character/
  child_boy/spirit_child_boy.glb
  child_girl/spirit_child_girl.glb
  teen_boy/spirit_teen_boy.glb
  ...
```
