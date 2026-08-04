# Models and remote loading

I updated the scene to support loading models from an external base URL via the Vite env variable `VITE_MODEL_BASE`.

By default the scene will try to load models from `/models/` (i.e. `public/models/avatar.glb`). If you don't want to commit binary model files to the repository, you can point the app at remote files using the `.env` file or a Vite dev server env variable.

Example .env for local dev (create a `.env` file in repo root):

VITE_MODEL_BASE=https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/

But note: the default expectation is three files at:
- ${MODEL_BASE}avatar.glb
- ${MODEL_BASE}cat.glb
- ${MODEL_BASE}notebook.glb

If using the Khronos raw URLs directly, an example VITE_MODEL_BASE that works with the files we referenced in README_models.md is:

VITE_MODEL_BASE=https://raw.githubusercontent.com/7ayl/room/init-magical-room/public/models/

(If you run the GitHub Actions workflow or `npm run download-models` locally, the files will be placed at public/models/ and the default model base `/models/` will work.)
