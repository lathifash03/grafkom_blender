"use strict";

async function parseMTL(text) {
  const materials = {};
  let material;

  const keywords = {
    newmtl(parts) {
      material = { name: parts[0] };
      materials[parts[0]] = material;
    },
    Ka: (parts) => (material.ambient = parseColor(parts)),
    Kd: (parts) => (material.diffuse = parseColor(parts)),
    Ks: (parts) => (material.specular = parseColor(parts)),
    Ns: (parts) => (material.shininess = parseFloat(parts[0])),
    map_Kd: (parts) => (material.diffuseMap = parts.join(" ")),
    map_Ks: (parts) => (material.specularMap = parts.join(" ")),
    map_Ns: (parts) => (material.shininessMap = parts.join(" ")),
    illum: (parts) => (material.illumination = parseInt(parts[0], 10)),
    d: (parts) => (material.opacity = parseFloat(parts[0])),
    Tr: (parts) => (material.transparency = parseFloat(parts[0])),
    Ni: (parts) => (material.refractionIndex = parseFloat(parts[0])),
    map_Bump: (parts) => (material.bumpMap = parts.join(" ")),
    map_d: (parts) => (material.alphaMap = parts.join(" ")),
  };

  text.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const match = /(\w+)\s*(.*)/.exec(trimmed);
      if (match) {
        const [_, keyword, args] = match;
        const handler = keywords[keyword];
        if (handler) handler(args.split(/\s+/));
        else console.warn(`Unknown keyword: ${keyword}`);
      }
    }
  });

  return materials;
}

const parseColor = (parts) =>
  parts.length === 3 ? parts.map(parseFloat) : [1, 1, 1];
