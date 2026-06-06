import "./style.css";
import * as THREE from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);
scene.fog = new THREE.Fog(0x222222, 4.0, 12.0);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.up.set(0, 0, 1); // Z is up

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
(document.getElementById("app") || document.body).appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;
controls.target.set(0, 0, 0);
controls.update();

scene.add(new THREE.HemisphereLight(0xffecd0, 0x5f6f88, 1.35));

const keyLight = new THREE.DirectionalLight(0xffd6a3, 2.8);
keyLight.position.set(4.5, -3.5, 6.0);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x9fb8ff, 0.7);
fillLight.position.set(-3.5, 4.0, 3.0);
scene.add(fillLight);

const toyWarmLight = new THREE.PointLight(0xffb76b, 1.65, 5.0, 1.8);
toyWarmLight.position.set(-0.7, -0.45, 2.15);
scene.add(toyWarmLight);

const fadeOverlay = document.getElementById("fade-overlay");

// ── Camera segments ───────────────────────────────────────────────────────────

const ZOOM_END_TIME = 8.6;
const HOLD_END_TIME = 9.1;
const TOTAL_DURATION = 9.8;
const FINAL_TILT_UP_AMOUNT = 1.1;
const FINAL_TILT_RIGHT_AMOUNT = 0.2;
const FINAL_ZOOM_IN_FOV_DELTA = 12;

const START_TARGET = new THREE.Vector3(-0.8341, 0.0221, 1.3320);
const ROOM_TARGET = new THREE.Vector3(-0.8912, -0.5694, 1.5675);
const ZOOM_CAMERA = new THREE.Vector3(-0.2896, 0.1742, 1.4013);
const ZOOM_TARGET_RAW = new THREE.Vector3(-0.2904, 0.1743, 1.4008);
const ZOOM_TARGET = ZOOM_CAMERA.clone().add(
  ZOOM_TARGET_RAW.clone().sub(ZOOM_CAMERA).normalize().multiplyScalar(2.0)
);
const CAMERA_UP_AXIS = new THREE.Vector3(0, 0, 1);
const ZOOM_FORWARD = ZOOM_TARGET.clone().sub(ZOOM_CAMERA).normalize();
const ZOOM_RIGHT = ZOOM_FORWARD.clone().cross(CAMERA_UP_AXIS).normalize();
const FINAL_TILT_OFFSET = CAMERA_UP_AXIS.clone()
  .multiplyScalar(FINAL_TILT_UP_AMOUNT)
  .add(ZOOM_RIGHT.clone().multiplyScalar(FINAL_TILT_RIGHT_AMOUNT));
const MID_TILT_TARGET = ZOOM_TARGET.clone().add(FINAL_TILT_OFFSET.clone().multiplyScalar(0.42));
const FINAL_TILT_TARGET = ZOOM_TARGET.clone().add(FINAL_TILT_OFFSET);

const segments = [
  {
    name: "startToDoor",
    start: 0.0,
    end: 2.24,
    camera: new THREE.CatmullRomCurve3([
      new THREE.Vector3(7.5356, -2.1893, 1.8766),
      new THREE.Vector3(6.35, -0.72, 1.885),
      new THREE.Vector3(4.70, 1.46, 1.892),
      new THREE.Vector3(3.1810, 2.9824, 1.8915),
    ]),
    target: new THREE.CatmullRomCurve3([
      START_TARGET,
      START_TARGET,
      START_TARGET,
      START_TARGET,
    ]),
  },
  {
    name: "throughDoor",
    start: 2.24,
    end: 3.78,
    camera: new THREE.CatmullRomCurve3([
      new THREE.Vector3(3.1810, 2.9824, 1.8915),
      new THREE.Vector3(2.15, 1.65, 1.84),
      new THREE.Vector3(0.95, 0.32, 1.74),
      new THREE.Vector3(0.0000, -0.5424, 1.6489),
    ]),
    target: new THREE.CatmullRomCurve3([
      START_TARGET,
      START_TARGET.clone().lerp(ROOM_TARGET, 0.42),
      START_TARGET.clone().lerp(ROOM_TARGET, 0.78),
      ROOM_TARGET,
    ]),
  },
  {
    name: "lookAround",
    start: 3.78,
    end: 5.85,
    camera: new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0000, -0.5424, 1.6489),
      new THREE.Vector3(-0.1678, -0.95, 1.7163),
      new THREE.Vector3(-0.3590, -1.05, 1.8745),
    ]),
    target: new THREE.CatmullRomCurve3([
      ROOM_TARGET,
      ROOM_TARGET,
      ROOM_TARGET,
    ]),
  },
  {
    name: "eyesOnToys",
    start: 5.85,
    end: 7.14,
    camera: new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.3590, -1.05, 1.8745),
      new THREE.Vector3(-0.2600, -1.06, 2.0300),
      new THREE.Vector3(-0.2174, -0.9839, 2.1338),
    ]),
    target: new THREE.CatmullRomCurve3([
      ROOM_TARGET,
      ROOM_TARGET,
      ROOM_TARGET,
    ]),
  },
  {
    name: "zoomInToys",
    start: 7.14,
    end: ZOOM_END_TIME,
    camera: new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2174, -0.9839, 2.1338),
      new THREE.Vector3(-0.1950, -0.8350, 2.1800),
      new THREE.Vector3(-0.2250, -0.4200, 1.8300),
      ZOOM_CAMERA,
    ]),
    target: new THREE.CatmullRomCurve3([
      ROOM_TARGET,
      ROOM_TARGET,
      ROOM_TARGET.clone().lerp(ZOOM_TARGET, 0.62),
      ZOOM_TARGET,
    ]),
  },
  {
    name: "holdAfterZoom",
    start: ZOOM_END_TIME,
    end: HOLD_END_TIME,
    camera: new THREE.CatmullRomCurve3([
      ZOOM_CAMERA,
      ZOOM_CAMERA,
    ]),
    target: new THREE.CatmullRomCurve3([
      ZOOM_TARGET,
      ZOOM_TARGET,
    ]),
  },
  {
    name: "liftAfterZoom",
    start: HOLD_END_TIME,
    end: TOTAL_DURATION,
    camera: new THREE.CatmullRomCurve3([
      ZOOM_CAMERA,
      ZOOM_CAMERA,
      ZOOM_CAMERA,
    ]),
    target: new THREE.CatmullRomCurve3([
      ZOOM_TARGET,
      MID_TILT_TARGET,
      FINAL_TILT_TARGET,
    ]),
  },
];

function getActiveSegment(elapsed) {
  const t = Math.min(elapsed, TOTAL_DURATION);
  for (const seg of segments) {
    if (t >= seg.start && t <= seg.end) return seg;
  }
  return segments[segments.length - 1];
}

function segmentT(elapsed, segment) {
  const local = (elapsed - segment.start) / (segment.end - segment.start);
  return THREE.MathUtils.clamp(local, 0, 1);
}

function easeInOut(t) {
  return t * t * (3.0 - 2.0 * t);
}

function easeOutCubic(t) {
  return 1.0 - Math.pow(1.0 - t, 3.0);
}

// ── Toy animation ─────────────────────────────────────────────────────────────

const tmpCameraPosition = new THREE.Vector3();
const tmpLookTarget = new THREE.Vector3();
const floatingToys = [];

const toyConfigs = [
  { path: "/assets/toy_woody.glb", label: "Toy Woody" },
  { path: "/assets/toy_jessy.glb", label: "Toy Jessy" },
  { path: "/assets/toy_bullseye.glb", label: "Toy Bullseye" },
  { path: "/assets/toy_rex.glb", label: "Toy Rex" },
];

function addToyModel(gltf, config) {
  const toy = gltf.scene;
  toy.rotation.x = Math.PI / 2;

  toy.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = false;
    obj.receiveShadow = true;
    if (obj.material) obj.material.side = THREE.DoubleSide;
  });

  scene.add(toy);
  floatingToys.push({
    object: toy,
    baseZ: toy.position.z,
    speed: 8.4 + floatingToys.length * 1.1,
    phase: floatingToys.length * 0.85,
    amplitude: 0.07,
  });
  console.log(`${config.label} loaded`, toy, new THREE.Box3().setFromObject(toy));
}

function updateToyFloat(elapsed) {
  const settleStart = ZOOM_END_TIME - 0.45;

  floatingToys.forEach((toy) => {
    if (elapsed >= ZOOM_END_TIME) {
      toy.object.position.z = toy.baseZ;
      return;
    }

    const settleT = THREE.MathUtils.clamp((elapsed - settleStart) / (ZOOM_END_TIME - settleStart), 0, 1);
    const amplitude = toy.amplitude * (1 - easeInOut(settleT));
    const bounce = (Math.sin(elapsed * toy.speed + toy.phase) + 1) * 0.5;
    toy.object.position.z = toy.baseZ + bounce * amplitude;
  });
}

// ── Effects ───────────────────────────────────────────────────────────────────

function updateCameraEffects(elapsed, segment, t) {
  let fov = 60;

  if (segment.name === "eyesOnToys") {
    fov = THREE.MathUtils.lerp(60, 44, t);
  }

  if (segment.name === "zoomInToys") {
    fov = THREE.MathUtils.lerp(44, 28, t);
    if (fadeOverlay) fadeOverlay.style.opacity = "0";
  } else if (segment.name === "holdAfterZoom") {
    fov = 28;
    if (fadeOverlay) fadeOverlay.style.opacity = "0";
  } else if (segment.name === "liftAfterZoom") {
    fov = THREE.MathUtils.lerp(28, 28 - FINAL_ZOOM_IN_FOV_DELTA, t);
    if (fadeOverlay) fadeOverlay.style.opacity = "0";
  } else {
    if (fadeOverlay) fadeOverlay.style.opacity = "0";
  }

  camera.fov = fov;
  camera.updateProjectionMatrix();
}

// ── Camera update ─────────────────────────────────────────────────────────────

const clock = new THREE.Clock();
let animationStartTime = null;
let assetsReady = false;

function updateCameraPath() {
  if (animationStartTime === null) return;

  const elapsed = Math.min(clock.getElapsedTime() - animationStartTime, TOTAL_DURATION);
  const segment = getActiveSegment(elapsed);
  let t = segmentT(elapsed, segment);

  if (segment.name === "eyesOnToys") {
    t = easeOutCubic(t);
  } else if (segment.name === "zoomInToys") {
    t = easeInOut(t);
  } else {
    t = easeInOut(t);
  }

  segment.camera.getPointAt(t, tmpCameraPosition);
  segment.target.getPointAt(t, tmpLookTarget);

  camera.position.copy(tmpCameraPosition);
  camera.lookAt(tmpLookTarget);

  updateCameraEffects(elapsed, segment, t);
  updateToyFloat(elapsed);
}

// ── Asset loading ─────────────────────────────────────────────────────────────

const loader = new PLYLoader();
const glbLoader = new GLTFLoader();
const assetPromises = [];

function beginAnimation() {
  assetsReady = true;
  animationStartTime = clock.getElapsedTime();
  segments[0].camera.getPointAt(0, tmpCameraPosition);
  segments[0].target.getPointAt(0, tmpLookTarget);
  camera.position.copy(tmpCameraPosition);
  camera.lookAt(tmpLookTarget);
  console.log("All assets loaded. Animation started.");

  if (recordWhenReady) {
    recordWhenReady = false;
    startCanvasRecording();
  }
}

// ── Canvas recording ─────────────────────────────────────────────────────────

let recorder = null;
let recordWhenReady = false;

function getRecordingMimeType() {
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function startCanvasRecording() {
  if (!("MediaRecorder" in window)) {
    console.error("MediaRecorder is not supported in this browser.");
    return;
  }

  if (!assetsReady) {
    recordWhenReady = true;
    console.log("Recording queued. It will start after assets finish loading.");
    return;
  }

  if (recorder && recorder.state !== "inactive") {
    console.log("Recording is already running.");
    return;
  }

  const chunks = [];
  const stream = renderer.domElement.captureStream(60);
  const mimeType = getRecordingMimeType();
  recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  recorder.onstop = () => {
    stream.getTracks().forEach((track) => track.stop());
    const blob = new Blob(chunks, { type: mimeType || "video/webm" });
    downloadBlob(blob, "real_room_camera_render.webm");
    console.log("Recording saved as real_room_camera_render.webm");
  };

  animationStartTime = clock.getElapsedTime();
  updateCameraPath();
  renderer.render(scene, camera);

  recorder.start();
  console.log("Recording started.");

  window.setTimeout(() => {
    if (recorder && recorder.state === "recording") recorder.stop();
  }, (TOTAL_DURATION + 0.25) * 1000);
}

function loadOptionalGlb(path, onLoad, label) {
  return fetch(path, { method: "HEAD" })
    .then((res) => {
      if (!res.ok) {
        console.log(`${label} skipped: ${path} not found`);
        return;
      }
      return new Promise((resolve) => {
        glbLoader.load(
          path,
          (gltf) => { onLoad(gltf); resolve(); },
          (xhr) => {
            if (xhr.total) console.log(`${label}: ${((xhr.loaded / xhr.total) * 100).toFixed(1)}%`);
          },
          (err) => { console.error(`Failed to load ${label}:`, err); resolve(); }
        );
      });
    })
    .catch((err) => { console.error(`Failed to check ${label}:`, err); });
}

assetPromises.push(
  new Promise((resolve) => {
    loader.load(
      "/assets/real_room_7_final.ply",
      (geometry) => {
        geometry.computeBoundingBox();
        console.log("PLY loaded:", geometry);
        console.log("Bounding box:", geometry.boundingBox);

        const material = new THREE.PointsMaterial({
          size: 0.016,
          vertexColors: true,
          sizeAttenuation: true,
          depthTest: true,
          depthWrite: true,
        });
        const pointCloud = new THREE.Points(geometry, material);
        pointCloud.position.set(0, 0, 0);
        scene.add(pointCloud);
        resolve();
      },
      (xhr) => { if (xhr.total) console.log(`PLY: ${((xhr.loaded / xhr.total) * 100).toFixed(1)}%`); },
      (err) => { console.error("Failed to load PLY:", err); resolve(); }
    );
  })
);

assetPromises.push(
  loadOptionalGlb("/assets/fake_room_final.glb", (gltf) => {
    gltf.scene.rotation.x = Math.PI / 2;
    scene.add(gltf.scene);
    console.log("GLB loaded:", gltf);
  }, "GLB")
);

assetPromises.push(
  loadOptionalGlb("/assets/proxy_final.glb", (gltf) => {
    gltf.scene.rotation.x = Math.PI / 2;
    gltf.scene.traverse((obj) => {
      if (obj.isMesh) obj.material.side = THREE.DoubleSide;
    });
    scene.add(gltf.scene);
    console.log("Proxy GLB loaded:", gltf);
  }, "Proxy GLB")
);

toyConfigs.forEach((config) => {
  assetPromises.push(
    loadOptionalGlb(
      config.path,
      (gltf) => addToyModel(gltf, config),
      config.label
    )
  );
});

Promise.all(assetPromises).then(beginAnimation);

// ── Render loop ───────────────────────────────────────────────────────────────

function animate() {
  requestAnimationFrame(animate);

  if (controls.enabled) {
    controls.update();
  } else {
    updateCameraPath();
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  if (key === "d") {
    controls.enabled = !controls.enabled;
    controls.update();
  }

  if (key === "r") {
    startCanvasRecording();
  }
});
