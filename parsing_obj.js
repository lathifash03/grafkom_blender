"use strict";
// Referensi: https://webglfundamentals.org/webgl/lessons/webgl-load-obj.html

function parseOBJ(text) {
  const positions = [[0, 0, 0]]; // Titik posisi
  const texcoords = [[0, 0]]; // Koordinat tekstur
  const normals = [[0, 0, 0]]; // Normal
  const colors = [[0, 0, 0]]; // RGB

  const vertexData = [positions, texcoords, normals, colors];

  let webglData = [[], [], [], []];

  const materials = [];
  const geometries = [];

  let currentGeometry;
  let groups = "default";
  let material = "default";
  let object = "default";

  function newGeometry() {
    if (currentGeometry && currentGeometry.data.position.length)
      currentGeometry = undefined;
  }

  function setGeometry() {
    if (!currentGeometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      const color = [];

      webglData = [position, texcoord, normal, color];
      currentGeometry = {
        object,
        groups,
        material,
        data: { position, texcoord, normal, color },
      };

      geometries.push(currentGeometry);
    }
  }

  function addVertex(vertex) {
    const parts = vertex.split("/");
    parts.forEach((indexStr, i) => {
      if (!indexStr) return;
      const index = parseInt(indexStr);
      const realIndex = index + (index >= 0 ? 0 : vertexData[i].length);
      webglData[i].push(...vertexData[i][realIndex]);

      if (i === 0 && colors.length > 1) {
        currentGeometry.data.color.push(...colors[realIndex]);
      }
    });
  }

  const keywords = {
    v(parts) {
      if (parts.length > 3) {
        positions.push(parts.slice(0, 3).map(parseFloat));
        colors.push(parts.slice(3).map(parseFloat));
      } else {
        positions.push(parts.map(parseFloat));
      }
    },
    vn(parts) {
      normals.push(parts.map(parseFloat));
    },
    vt(parts) {
      texcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      setGeometry();
      const numTriangles = parts.length - 2;
      for (let i = 0; i < numTriangles; ++i) {
        addVertex(parts[0]);
        addVertex(parts[i + 1]);
        addVertex(parts[i + 2]);
      }
    },
    mtllib(parts, unparsedArgs) {
      materials.push(unparsedArgs);
    },
    usemtl(parts, unparsedArgs) {
      material = unparsedArgs;
      newGeometry();
    },
    g(parts) {
      groups = parts;
      newGeometry();
    },
    o(parts, unparsedArgs) {
      object = unparsedArgs;
      newGeometry();
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split("\n");
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === "" || line.startsWith("#")) continue;

    const m = keywordRE.exec(line);
    if (!m) continue;

    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn("unhandled keyword:", keyword);
      continue;
    }

    handler(parts, unparsedArgs);
  }

  let i = 0;
  while (i < geometries.length) {
    const geometry = geometries[i];
    geometry.data = Object.fromEntries(
      Object.entries(geometry.data).filter(([, array]) => array.length > 0)
    );
    i++;
  }

  return {
    materials,
    geometries,
  };
}
