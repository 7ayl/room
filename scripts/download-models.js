#!/usr/bin/env node
// downloads a few glTF models from Khronos sample models into public/models
// Usage: node scripts/download-models.js

const fs = require('fs');
const path = require('path');
const https = require('https');

const outDir = path.join(__dirname, '..', 'public', 'models');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const models = [
  {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb',
    file: 'avatar.glb',
    name: 'Fox'
  },
  {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    file: 'cat.glb',
    name: 'Duck'
  },
  {
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb',
    file: 'notebook.glb',
    name: 'Avocado'
  }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error('Failed to download ' + url + ' Status: ' + res.statusCode));
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      try { fs.unlinkSync(dest); } catch (e) {}
      reject(err);
    });
  });
}

(async () => {
  try {
    for (const m of models) {
      const dest = path.join(outDir, m.file);
      console.log('Downloading', m.name, '->', dest);
      await download(m.url, dest);
      console.log('Saved', dest);
    }
    console.log('All models downloaded to', outDir);
  } catch (err) {
    console.error('Error downloading models:', err);
    process.exit(1);
  }
})();
