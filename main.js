async function main() {
    // Get A WebGL context
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl");
  
    if (!gl) return;
  
    createHandler(canvas);
  
    const vs = `
    attribute vec4 a_position;
    attribute vec3 a_normal;
    attribute vec4 a_color;
  
    uniform mat4 u_projection;
    uniform mat4 u_view;
    uniform mat4 u_world;
  
    varying vec3 v_normal;
    varying vec3 v_worldPosition;
    varying vec4 v_color;
  
    void main() {
      gl_Position = u_projection * u_view * u_world * a_position;
      v_worldPosition = (u_world * a_position).xyz;
      v_normal = mat3(u_world) * a_normal;
      v_color = a_color;
    }
    `;
  
    const fs = `
    precision mediump float;
  
    varying vec3 v_normal;
    varying vec4 v_color;
  
    uniform vec3 u_lightDirection;
    uniform vec4 u_diffuse;
  
    void main () {
      vec3 normal = normalize(v_normal);
      float light = max(dot(u_lightDirection, normal), 0.0);
      vec4 diffuse = u_diffuse * v_color;
      gl_FragColor = vec4(diffuse.rgb * light, diffuse.a);
    }
    `;
  
    // Shader program setup
    const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);
  
    // Load and parse OBJ file
    const response = await fetch("data/VasBunga.obj");
    const text = await response.text();
    const obj = parseOBJ(text);
  
    // Load and parse MTL file
    const mtlResponse = await fetch("data/VasBunga.mtl");
    const mtlText = await mtlResponse.text();
    const materials = await parseMTL(mtlText);
  
    const materialLib = {};
    for (const [name, material] of Object.entries(materials)) {
      materialLib[name] = {
        u_diffuse: material.diffuse
          ? [...material.diffuse, 1] // Add alpha = 1
          : [1, 1, 1, 1], // Default white
      };
    }
  
    // Prepare geometries and buffers
    const parts = obj.geometries.map(({ material, data }) => {
      if (!data.color) {
        data.color = { value: [1, 1, 1, 1] };
      }
      return {
        material: materialLib[material] || { u_diffuse: [1, 1, 1, 1] },
        bufferInfo: webglUtils.createBufferInfoFromArrays(gl, data),
      };
    });
  
    // Set up camera and scene
    const extents = getGeometriesExtents(obj.geometries);
    const range = m4.subtractVectors(extents.max, extents.min);
    const objOffset = m4.scaleVector(
      m4.addVectors(extents.min, m4.scaleVector(range, 0.5)),
      -1
    );
    const cameraTarget = [0, 0, 0];
    const radius = m4.length(range) * 1.2;
    const zNear = radius / 100;
    const zFar = radius * 3;
  
    function render(time) {
      time *= 0.001; // Convert to seconds
  
      webglUtils.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.enable(gl.DEPTH_TEST);
  
      const fieldOfViewRadians = Math.PI / 3;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
  
      const radiusWithZoom = radius * zoom;
      const camera = m4.lookAt([0, 0, radiusWithZoom], cameraTarget, [0, 1, 0]);
      const view = m4.inverse(camera);
  
      const sharedUniforms = {
        u_lightDirection: m4.normalize([-1, 3, 5]),
        u_view: view,
        u_projection: projection,
      };
  
      gl.useProgram(meshProgramInfo.program);
      webglUtils.setUniforms(meshProgramInfo, sharedUniforms);
      
      rotation.y += 0.01; // Rotate around the y-axis
      let u_world = m4.identity();
      u_world = m4.translate(u_world, ...objOffset);
      u_world = m4.yRotate(u_world, rotation.y);
      u_world = m4.xRotate(u_world, rotation.x);
  
      for (const { bufferInfo, material } of parts) {
        webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
        webglUtils.setUniforms(meshProgramInfo, {
          u_world,
          u_diffuse: material.u_diffuse,
        });
        webglUtils.drawBufferInfo(gl, bufferInfo);
      }
  
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }
  
  // Utility Functions
  function getExtents(positions) {
    const min = positions.slice(0, 3);
    const max = positions.slice(0, 3);
    for (let i = 3; i < positions.length; i += 3) {
      for (let j = 0; j < 3; ++j) {
        const v = positions[i + j];
        min[j] = Math.min(v, min[j]);
        max[j] = Math.max(v, max[j]);
      }
    }
    return { min, max };
  }
  
  function getGeometriesExtents(geometries) {
    return geometries.reduce(
      ({ min, max }, { data }) => {
        const minMax = getExtents(data.position);
        return {
          min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
          max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
        };
      },
      {
        min: Array(3).fill(Number.POSITIVE_INFINITY),
        max: Array(3).fill(Number.NEGATIVE_INFINITY),
      }
    );
  }
  
  main();
  