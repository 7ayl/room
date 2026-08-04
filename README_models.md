### Models added by scripts/download-models.js

This repository includes a helper script to download several low-poly sample models from the Khronos glTF Sample Models repository. These are used as placeholder models (avatar / cat / notebook) to demonstrate integration. The script downloads the following files into public/models/:

- avatar.glb <- Fox (Khronos glTF Sample Models)
  - Source: https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/Fox
  - Raw file used: https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb
- cat.glb <- Duck (Khronos glTF Sample Models)
  - Source: https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/Duck
  - Raw file used: https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb
- notebook.glb <- Avocado (Khronos glTF Sample Models)
  - Source: https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/Avocado
  - Raw file used: https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb

License & attribution
- These sample models come from the KhronosGroup glTF-Sample-Models repository. Licenses vary by model; many are provided by authors under permissive terms. Before using in a public product, please verify the license on the source pages above. I selected these as CC0/educational placeholders but please confirm for production use.

How to download models locally
1. Ensure you have node installed
2. Run:
   npm run download-models

This will place files in public/models/avatar.glb, public/models/cat.glb, public/models/notebook.glb
