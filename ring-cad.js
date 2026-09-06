/**
 * Ring CAD Studio - 3D Parametric Jewelry Engine
 * Open-source Three.js CAD modeler for Tiffany Harmony 6-Prong with Diamond 1 (OEC)
 */

import * as THREE from './vendor/three/three.module.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { STLExporter } from './vendor/three/STLExporter.js';
import { GLTFExporter } from './vendor/three/GLTFExporter.js';
import { OBJExporter } from './vendor/three/OBJExporter.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';

// --- Global State ---
export const CAD_STATE = {
  // Center Stone (Default: Diamond 1 IGI LG822610026)
  stone: {
    id: 'd1',
    carat: 1.05,
    diameter: 6.37, // mm
    depth: 3.95, // mm
    tableRatio: 0.53, // 53%
    crownHeightRatio: 0.20, // 20% (1.27 mm)
    crownAngle: 40.1, // deg
    pavilionDepthRatio: 0.38, // 38% (2.42 mm)
    pavilionAngle: 39.1, // deg
    culetRatio: 0.08, // 8% open culet
    girdleRatio: 0.025,
    sinkOffset: 0.0, // mm vertical sink into basket
    displayMode: 'faceted', // 'faceted' or 'scintillation'
  },

  // Band / Shank (Tiffany Harmony Geometry)
  band: {
    ringSizeUS: 6.0,
    baseWidth: 2.4, // mm
    baseThickness: 1.8, // mm
    edgeThickness: 0.95, // mm
    bandProfile: 'comfort_peaked', // 'comfort_peaked', 'comfort_round', 'knife_edge', 'flat'
    taperStyle: 'harmony_solid', // 'harmony_solid', 'harmony_split', 'classic_taper'
    shoulderPinch: 0.62, // waist width is 62% of base (~1.49 mm)
    shoulderFlute: 1.35, // flutes out 1.35x from pinch waist towards prongs (~2.01 mm)
    waistPosition: 0.45, // waist sits ~22 deg from head
    cathedralRise: 0.90, // mm extra radial rise at shoulders
    crestSharpness: 1.55, // power exponent for peaked ridge
    comfortFit: 0.12, // mm inner comfort radius offset
    takeoffAngleDeg: 38, // degrees from vertical where cathedral shoulders lift off shank
    bridgeThickness: 1.15, // mm inner finger bridge rail under basket
    bridgeWidth: 1.85, // mm width of bridge rail
    taperSpanDeg: 50, // degrees over which taper occurs
  },

  // Setting / Prongs
  head: {
    prongCount: 6, // 6 prongs (user choice) or 4 prongs
    prongStyle: 'claw', // 'claw' or 'round'
    headStyle: 'harmony_basket', // 'harmony_basket' or 'tulip_petal'
    prongThickness: 0.85, // mm
    clawReach: 0.32, // mm claw inward curl
    galleryRail: true,
    railThickness: 0.65, // mm
    baseCollar: true,
    collarThickness: 0.70, // mm
    collarRadius: 1.65, // mm
    bridgeClearance: 1.50, // mm clearance above inner finger hole (collar sits atop 1.15mm bridge)
  },

  // Metal & Environment
  metal: {
    alloy: 'pt950', // 'pt950', 'wg18k', 'yg18k', 'rg18k'
    finish: 'polish', // 'polish' or 'satin'
  },

  // Viewport Settings
  viewport: {
    autoRotate: false,
    autoRotateSpeed: 1.5,
    lightingPreset: 'studio',
    showDimensions: true,
  }
};

// Metal Alloy Properties (Density in g/cm3)
export const METAL_SPECS = {
  pt950: {
    name: 'Platinum Pt950',
    color: 0xdedede,
    metalness: 1.0,
    roughness: 0.08,
    envIntensity: 2.4,
    density: 21.45,
    desc: 'Pure 95% Platinum with high luster and heirloom heft.'
  },
  wg18k: {
    name: '18K White Gold',
    color: 0xf5f5f5,
    metalness: 1.0,
    roughness: 0.06,
    envIntensity: 2.6,
    density: 15.58,
    desc: 'Rhodium-plated 75% gold, bright cool mirror reflection.'
  },
  yg18k: {
    name: '18K Yellow Gold',
    color: 0xebb952,
    metalness: 0.96,
    roughness: 0.10,
    envIntensity: 2.1,
    density: 15.58,
    desc: 'Warm royal yellow gold alloy (75% Au, 12.5% Ag, 12.5% Cu).'
  },
  rg18k: {
    name: '18K Rose Gold',
    color: 0xe59784,
    metalness: 0.96,
    roughness: 0.10,
    envIntensity: 2.1,
    density: 15.58,
    desc: 'Romantic blush copper-gold alloy.'
  }
};

// Preset Diamonds
export const PRESET_STONES = {
  d1: {
    id: 'd1',
    name: 'Diamond 1 (IGI LG822610026)',
    carat: 1.05,
    color: 'D',
    clarity: 'VVS2',
    diameter: 6.37,
    depth: 3.95,
    tableRatio: 0.53,
    crownHeightRatio: 0.20,
    crownAngle: 40.1,
    pavilionDepthRatio: 0.38,
    pavilionAngle: 39.1,
    culetRatio: 0.08,
    girdleRatio: 0.025,
    sinkOffset: 0.0
  },
  d2: {
    id: 'd2',
    name: 'Diamond 2 (IGI LG811692198)',
    carat: 1.07,
    color: 'D',
    clarity: 'VVS2',
    diameter: 6.43,
    depth: 4.04,
    tableRatio: 0.53,
    crownHeightRatio: 0.185,
    crownAngle: 38.1,
    pavilionDepthRatio: 0.40,
    pavilionAngle: 39.7,
    culetRatio: 0.08,
    girdleRatio: 0.025,
    sinkOffset: 0.0
  },
  d3: {
    id: 'd3',
    name: 'Diamond 3 (IGI LG795632770)',
    carat: 1.07,
    color: 'D',
    clarity: 'VVS2',
    diameter: 6.45,
    depth: 4.07,
    tableRatio: 0.54,
    crownHeightRatio: 0.18,
    crownAngle: 37.8,
    pavilionDepthRatio: 0.40,
    pavilionAngle: 39.8,
    culetRatio: 0.08,
    girdleRatio: 0.025,
    sinkOffset: 0.0
  }
};

// Curated Design Presets matching the CAD Photos in /rings
export const RING_PRESETS = {
  harmony_6claw: {
    name: 'Tiffany Harmony 6-Prong (Solid)',
    desc: 'Our bespoke selection: 6 delicate claw prongs with rounded solid hourglass taper, peaked crest ridge, and ultra-low cathedral setting.',
    band: {
      ringSizeUS: 6.0,
      baseWidth: 2.40,
      baseThickness: 1.80,
      edgeThickness: 0.95,
      bandProfile: 'comfort_peaked',
      taperStyle: 'harmony_solid',
      shoulderPinch: 0.62,
      shoulderFlute: 1.35,
      waistPosition: 0.45,
      cathedralRise: 0.90,
      crestSharpness: 1.55,
      comfortFit: 0.12,
      taperSpanDeg: 50
    },
    head: {
      prongCount: 6,
      prongStyle: 'claw',
      headStyle: 'harmony_basket',
      prongThickness: 0.85,
      clawReach: 0.32,
      galleryRail: true,
      railThickness: 0.65,
      baseCollar: true,
      collarThickness: 0.70,
      collarRadius: 1.55,
      bridgeClearance: 0.80
    },
    metal: { alloy: 'pt950', finish: 'polish' }
  },
  harmony_6split: {
    name: 'Tiffany Harmony 6-Prong (Split Loop)',
    desc: '6 claw prongs with sculptural split cathedral arms opening into an open teardrop window.',
    band: {
      ringSizeUS: 6.0,
      baseWidth: 2.60,
      baseThickness: 1.80,
      edgeThickness: 0.95,
      bandProfile: 'comfort_peaked',
      taperStyle: 'harmony_split',
      shoulderPinch: 0.58,
      shoulderFlute: 1.40,
      waistPosition: 0.45,
      cathedralRise: 1.05,
      crestSharpness: 1.55,
      comfortFit: 0.12,
      taperSpanDeg: 52
    },
    head: {
      prongCount: 6,
      prongStyle: 'claw',
      headStyle: 'harmony_basket',
      prongThickness: 0.85,
      clawReach: 0.32,
      galleryRail: true,
      railThickness: 0.65,
      baseCollar: true,
      collarThickness: 0.70,
      collarRadius: 1.55,
      bridgeClearance: 0.85
    },
    metal: { alloy: 'pt950', finish: 'polish' }
  },
  harmony_4claw: {
    name: 'Classic Tiffany Harmony 4-Prong',
    desc: 'Classic 4-prong low-set basket with peaked crest hourglass taper band.',
    band: {
      ringSizeUS: 6.0,
      baseWidth: 2.30,
      baseThickness: 1.80,
      edgeThickness: 0.90,
      bandProfile: 'comfort_peaked',
      taperStyle: 'harmony_solid',
      shoulderPinch: 0.65,
      shoulderFlute: 1.30,
      waistPosition: 0.45,
      cathedralRise: 0.80,
      crestSharpness: 1.55,
      comfortFit: 0.12,
      taperSpanDeg: 48
    },
    head: {
      prongCount: 4,
      prongStyle: 'claw',
      headStyle: 'harmony_basket',
      prongThickness: 0.90,
      clawReach: 0.35,
      galleryRail: true,
      railThickness: 0.65,
      baseCollar: true,
      collarThickness: 0.70,
      collarRadius: 1.55,
      bridgeClearance: 0.80
    },
    metal: { alloy: 'pt950', finish: 'polish' }
  },
  tulip_6prong: {
    name: 'Tulip Petal 6-Prong Cathedral',
    desc: 'Flowing petal prongs curving outwards from the bridge into a blooming tulip silhouette.',
    band: {
      ringSizeUS: 6.0,
      baseWidth: 2.40,
      baseThickness: 1.90,
      edgeThickness: 0.95,
      bandProfile: 'comfort_peaked',
      taperStyle: 'harmony_solid',
      shoulderPinch: 0.68,
      shoulderFlute: 1.35,
      waistPosition: 0.45,
      cathedralRise: 1.10,
      crestSharpness: 1.55,
      comfortFit: 0.12,
      taperSpanDeg: 48
    },
    head: {
      prongCount: 6,
      prongStyle: 'claw',
      headStyle: 'tulip_petal',
      prongThickness: 0.85,
      clawReach: 0.32,
      galleryRail: true,
      railThickness: 0.65,
      baseCollar: true,
      collarThickness: 0.70,
      collarRadius: 1.55,
      bridgeClearance: 0.95
    },
    metal: { alloy: 'pt950', finish: 'polish' }
  }
};

/**
 * 1. Parametric Old European Cut (OEC) 58-Facet Diamond Geometry
 */
export function createOECDiamondGeometry(params = CAD_STATE.stone) {
  const {
    diameter = 6.37,
    tableRatio = 0.53,
    crownHeightRatio = 0.20,
    pavilionDepthRatio = 0.38,
    girdleRatio = 0.025,
    culetRatio = 0.08
  } = params;

  const rGirdle = diameter / 2;
  const rTable = rGirdle * tableRatio;
  const hCrown = diameter * crownHeightRatio;
  const hGirdle = diameter * girdleRatio;
  const hPavilion = diameter * pavilionDepthRatio;
  const rCulet = rGirdle * culetRatio;

  const positions = [];

  function addTri(p1, p2, p3) {
    positions.push(...p1, ...p2, ...p3);
  }

  // Table (8 vertices)
  const tablePts = [];
  const yTable = hCrown + hGirdle / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    tablePts.push([rTable * Math.cos(a), yTable, rTable * Math.sin(a)]);
  }

  // Table Fan
  const centerTable = [0, yTable, 0];
  for (let i = 0; i < 8; i++) {
    addTri(centerTable, tablePts[i], tablePts[(i + 1) % 8]);
  }

  // Upper Girdle (16 vertices)
  const yGirdleTop = hGirdle / 2;
  const upperGirdlePts = [];
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    upperGirdlePts.push([rGirdle * Math.cos(a), yGirdleTop, rGirdle * Math.sin(a)]);
  }

  // Star Points (8 vertices)
  const starPts = [];
  const rStar = (rTable + rGirdle) * 0.48;
  const yStar = (yTable + yGirdleTop) * 0.58;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    starPts.push([rStar * Math.cos(a), yStar, rStar * Math.sin(a)]);
  }

  // Star Facets (8 triangles)
  for (let i = 0; i < 8; i++) {
    const t1 = tablePts[(i + 7) % 8];
    const t2 = tablePts[i];
    const s = starPts[i];
    addTri(t1, t2, s);
  }

  // Crown Bezel / Kite Facets (8 bezels -> 16 triangles)
  for (let i = 0; i < 8; i++) {
    const t = tablePts[i];
    const s1 = starPts[i];
    const s2 = starPts[(i + 1) % 8];
    const g = upperGirdlePts[(i * 2 + 1) % 16];
    addTri(t, s2, g);
    addTri(t, g, s1);
  }

  // Upper Girdle Halves (16 triangles)
  for (let i = 0; i < 8; i++) {
    const s = starPts[i];
    const gCorner = upperGirdlePts[(i * 2) % 16];
    const gMidPrev = upperGirdlePts[(i * 2 + 15) % 16];
    const gMidNext = upperGirdlePts[(i * 2 + 1) % 16];
    addTri(s, gCorner, gMidNext);
    addTri(s, gMidPrev, gCorner);
  }

  // Lower Girdle (16 vertices)
  const yGirdleBottom = -hGirdle / 2;
  const lowerGirdlePts = [];
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    lowerGirdlePts.push([rGirdle * Math.cos(a), yGirdleBottom, rGirdle * Math.sin(a)]);
  }

  // Girdle Band Facets (16 quads -> 32 triangles)
  for (let i = 0; i < 16; i++) {
    const top1 = upperGirdlePts[i];
    const top2 = upperGirdlePts[(i + 1) % 16];
    const bot1 = lowerGirdlePts[i];
    const bot2 = lowerGirdlePts[(i + 1) % 16];
    addTri(top1, bot2, top2);
    addTri(top1, bot1, bot2);
  }

  // Culet (8 vertices)
  const yCulet = -hPavilion - hGirdle / 2;
  const culetPts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    culetPts.push([rCulet * Math.cos(a), yCulet, rCulet * Math.sin(a)]);
  }

  // Pavilion Mains (8 chunky facets -> 16 triangles)
  for (let i = 0; i < 8; i++) {
    const gBot = lowerGirdlePts[(i * 2 + 1) % 16];
    const gPrev = lowerGirdlePts[(i * 2) % 16];
    const gNext = lowerGirdlePts[(i * 2 + 2) % 16];
    const c = culetPts[i];
    addTri(gPrev, gBot, c);
    addTri(gBot, gNext, c);
  }

  // Pavilion Lower Halves (16 triangles)
  for (let i = 0; i < 8; i++) {
    const c1 = culetPts[i];
    const c2 = culetPts[(i + 1) % 8];
    const gMid = lowerGirdlePts[(i * 2 + 2) % 16];
    addTri(c1, gMid, c2);
  }

  // Culet Open Facet (8-sided flat culet)
  const centerCulet = [0, yCulet, 0];
  for (let i = 0; i < 8; i++) {
    addTri(centerCulet, culetPts[(i + 1) % 8], culetPts[i]);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.computeVertexNormals();
  return geom;
}

/**
 * Helper: Merge multiple THREE.BufferGeometry into one watertight BufferGeometry
 */
export function mergeBufferGeometries(geometries) {
  let totalVerts = 0;
  let totalIndices = 0;
  geometries.forEach(g => {
    if (!g) return;
    totalVerts += g.attributes.position.count;
    if (g.index) totalIndices += g.index.count;
  });

  const posArray = new Float32Array(totalVerts * 3);
  const normArray = new Float32Array(totalVerts * 3);
  const indexArray = new Uint32Array(totalIndices);

  let vertOffset = 0;
  let indexOffset = 0;

  geometries.forEach(g => {
    if (!g) return;
    const pos = g.attributes.position.array;
    const norm = g.attributes.normal.array;
    posArray.set(pos, vertOffset * 3);
    normArray.set(norm, vertOffset * 3);

    const baseVertex = vertOffset;
    const indices = g.index.array;
    for (let i = 0; i < indices.length; i++) {
      indexArray[indexOffset + i] = indices[i] + baseVertex;
    }

    vertOffset += g.attributes.position.count;
    indexOffset += g.index.count;
  });

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normArray, 3));
  merged.setIndex(new THREE.BufferAttribute(indexArray, 1));
  return merged;
}

/**
 * 2a. Lower Shank and Inner Finger Bridge Rail Geometry (Continuous 360 ring)
 */
export function createLowerShankAndBridgeGeometry(bandParams = CAD_STATE.band) {
  const {
    ringSizeUS = 6.0,
    baseWidth = 2.40,
    baseThickness = 1.80,
    edgeThickness = 0.95,
    bandProfile = 'comfort_peaked',
    crestSharpness = 1.55,
    comfortFit = 0.12,
    takeoffAngleDeg = 38,
    bridgeThickness = 1.15,
    bridgeWidth = 1.85,
    crossSegments = 32
  } = bandParams;

  const innerDiameter = 11.63 + 0.8128 * ringSizeUS;
  const innerRadius = innerDiameter / 2;
  const takeoffRad = (takeoffAngleDeg * Math.PI) / 180;
  const tuckRad = (1.5 * Math.PI) / 180;

  // 1. Lower Shank Horseshoe: sweeps around bottom palm between left and right takeoff roots
  // theta0 at right: pi/2 - (takeoffRad + tuckRad)
  // theta0 at left: pi/2 + (takeoffRad + tuckRad)
  const thetaStart = Math.PI / 2 + (takeoffRad + tuckRad); // left takeoff
  const thetaEnd = 2 * Math.PI + Math.PI / 2 - (takeoffRad + tuckRad); // right takeoff
  const shankSweep = thetaEnd - thetaStart;
  const shankSteps = 72;

  const shankPositions = [];
  const shankIndices = [];

  for (let i = 0; i <= shankSteps; i++) {
    const u = i / shankSteps;
    const theta = thetaStart + u * shankSweep;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const w = baseWidth;
    const th = baseThickness;
    const edgeTh = edgeThickness;

    for (let j = 0; j < crossSegments; j++) {
      const alpha = (j / crossSegments) * 2 * Math.PI;
      const cosA = Math.cos(alpha);
      const sinA = Math.sin(alpha);
      const nz = Math.abs(sinA);

      const z = (w / 2) * Math.sign(sinA) * Math.pow(nz, 0.88);

      let rOffset = 0;
      if (cosA >= 0) {
        let k = 1.0;
        if (bandProfile === 'comfort_peaked') {
          k = Math.pow(Math.max(0, 1.0 - nz), crestSharpness);
        } else if (bandProfile === 'knife_edge') {
          k = Math.max(0, 1.0 - nz);
        } else if (bandProfile === 'comfort_round') {
          k = Math.sqrt(Math.max(0, 1.0 - nz * nz));
        } else {
          k = Math.max(0, 1.0 - Math.pow(nz, 4));
        }
        rOffset = edgeTh + (th - edgeTh) * k * Math.pow(cosA, 0.90);
      } else {
        const k = 1.0 - Math.pow(Math.abs(cosA), 0.75);
        rOffset = edgeTh * k;
        if (nz < 0.85) {
          rOffset -= comfortFit * (1.0 - (nz / 0.85) * (nz / 0.85)) * Math.pow(Math.abs(cosA), 0.85);
        }
      }

      const r = innerRadius + rOffset;
      shankPositions.push(r * cosT, r * sinT, z);
    }
  }

  for (let i = 0; i < shankSteps; i++) {
    for (let j = 0; j < crossSegments; j++) {
      const nextJ = (j + 1) % crossSegments;
      const a = i * crossSegments + j;
      const b = (i + 1) * crossSegments + j;
      const c = (i + 1) * crossSegments + nextJ;
      const d = i * crossSegments + nextJ;
      shankIndices.push(a, b, c);
      shankIndices.push(a, c, d);
    }
  }

  const gShank = new THREE.BufferGeometry();
  gShank.setAttribute('position', new THREE.Float32BufferAttribute(shankPositions, 3));
  gShank.setIndex(shankIndices);
  gShank.computeVertexNormals();

  // 2. Bridge Rail: sweeps under basket across top of finger hole between left and right takeoff roots
  const bridgeSteps = 28;
  const bridgePositions = [];
  const bridgeIndices = [];

  // Sweep from right takeoff (bThetaStart) to left takeoff (bThetaEnd) with increasing theta
  const bThetaStart = Math.PI / 2 - (takeoffRad + tuckRad);
  const bThetaEnd = Math.PI / 2 + (takeoffRad + tuckRad);

  for (let i = 0; i <= bridgeSteps; i++) {
    const u = i / bridgeSteps;
    const theta = bThetaStart + u * (bThetaEnd - bThetaStart);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const uCenter = Math.abs(u - 0.5) * 2.0;
    const kWidth = uCenter * uCenter * (3 - 2 * uCenter);
    const w = bridgeWidth + (baseWidth - bridgeWidth) * kWidth;

    const th = bridgeThickness;
    const edgeTh = bridgeThickness * 0.70;

    for (let j = 0; j < crossSegments; j++) {
      const alpha = (j / crossSegments) * 2 * Math.PI;
      const cosA = Math.cos(alpha);
      const sinA = Math.sin(alpha);
      const nz = Math.abs(sinA);

      const z = (w / 2) * Math.sign(sinA) * Math.pow(nz, 0.88);

      let rOffset = 0;
      if (cosA >= 0) {
        const k = Math.sqrt(Math.max(0, 1.0 - nz * nz));
        rOffset = edgeTh + (th - edgeTh) * k * Math.pow(cosA, 0.90);
      } else {
        const k = 1.0 - Math.pow(Math.abs(cosA), 0.75);
        rOffset = edgeTh * k;
        if (nz < 0.85) {
          rOffset -= comfortFit * (1.0 - (nz / 0.85) * (nz / 0.85)) * Math.pow(Math.abs(cosA), 0.85);
        }
      }

      const r = innerRadius + rOffset;
      bridgePositions.push(r * cosT, r * sinT, z);
    }
  }

  for (let i = 0; i < bridgeSteps; i++) {
    for (let j = 0; j < crossSegments; j++) {
      const nextJ = (j + 1) % crossSegments;
      const a = i * crossSegments + j;
      const b = (i + 1) * crossSegments + j;
      const c = (i + 1) * crossSegments + nextJ;
      const d = i * crossSegments + nextJ;
      bridgeIndices.push(a, b, c);
      bridgeIndices.push(a, c, d);
    }
  }

  const gBridge = new THREE.BufferGeometry();
  gBridge.setAttribute('position', new THREE.Float32BufferAttribute(bridgePositions, 3));
  gBridge.setIndex(bridgeIndices);
  gBridge.computeVertexNormals();

  return mergeBufferGeometries([gShank, gBridge]);
}

/**
 * 2b. Cathedral Flying Buttress Shoulder Geometry (Left or Right)
 */
export function createCathedralShoulderGeometry(side, bandParams = CAD_STATE.band, headTargets = null) {
  const {
    ringSizeUS = 6.0,
    baseWidth = 2.40,
    baseThickness = 1.80,
    edgeThickness = 0.95,
    shoulderPinch = 0.62,
    shoulderFlute = 1.35,
    waistPosition = 0.45,
    cathedralRise = 0.90,
    crestSharpness = 1.55,
    taperStyle = 'harmony_solid',
    takeoffAngleDeg = 38,
    bridgeThickness = 1.15,
    steps = 32,
    crossSegments = 24
  } = bandParams;

  const innerDiameter = 11.63 + 0.8128 * ringSizeUS;
  const innerRadius = innerDiameter / 2;
  const takeoffRad = (takeoffAngleDeg * Math.PI) / 180;

  // Polar angle theta0 at takeoff: tuck shoulder root 1.5 deg into shank for seamless continuous blend
  const tuckRad = (1.5 * Math.PI) / 180;
  const theta0 = side > 0 ? (Math.PI / 2 - (takeoffRad + tuckRad)) : (Math.PI / 2 + (takeoffRad + tuckRad));

  // Outer crest start point on shank outer surface
  const pOut0 = new THREE.Vector3(
    (innerRadius + baseThickness) * Math.cos(theta0),
    (innerRadius + baseThickness) * Math.sin(theta0),
    0
  );

  // Inner ceiling start point on top of bridge rail
  const pIn0 = new THREE.Vector3(
    (innerRadius + bridgeThickness) * Math.cos(theta0),
    (innerRadius + bridgeThickness) * Math.sin(theta0),
    0
  );

  // Outer crest end point at basket gallery rail
  const xJunction = headTargets ? headTargets.xJunction : 2.50;
  const yJunction = headTargets ? headTargets.yJunction : (innerRadius + bridgeThickness + 1.45);
  const pOut1 = new THREE.Vector3(side * xJunction, yJunction, 0);

  // Inner ceiling end point at basket collar
  const xCollar = Math.max(1.10, xJunction - 0.95);
  const yCollar = innerRadius + bridgeThickness + 0.30;
  const pIn1 = new THREE.Vector3(side * xCollar, yCollar, 0);

  // Circle tangents at theta0 ensure C1 continuous curvature
  const tCircle = side > 0
    ? new THREE.Vector3(-Math.sin(theta0), Math.cos(theta0), 0).normalize()
    : new THREE.Vector3(Math.sin(theta0), -Math.cos(theta0), 0).normalize();

  // Outer curve
  const distOut = pOut0.distanceTo(pOut1);
  const tOut1 = new THREE.Vector3(-side * 0.707, 0.707, 0).normalize();
  const cOut1 = pOut0.clone().add(tCircle.clone().multiplyScalar(distOut * 0.44));
  const cOut2 = pOut1.clone().sub(tOut1.clone().multiplyScalar(distOut * 0.38)).add(new THREE.Vector3(0, cathedralRise * 0.16, 0));
  const outerCurve = new THREE.CubicBezierCurve3(pOut0, cOut1, cOut2, pOut1);

  // Inner ceiling curve
  const distIn = pIn0.distanceTo(pIn1);
  const tIn1 = new THREE.Vector3(-side * 0.85, 0.52, 0).normalize();
  const cIn1 = pIn0.clone().add(tCircle.clone().multiplyScalar(distIn * 0.42));
  const cIn2 = pIn1.clone().sub(tIn1.clone().multiplyScalar(distIn * 0.35));
  const innerCurve = new THREE.CubicBezierCurve3(pIn0, cIn1, cIn2, pIn1);

  const positions = [];
  const indices = [];

  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const ptOut = outerCurve.getPoint(s);
    const ptIn = innerCurve.getPoint(s);

    const midPt = ptOut.clone().add(ptIn).multiplyScalar(0.5);
    const radVec = ptOut.clone().sub(ptIn);
    const h = Math.max(0.08, radVec.length());
    const normal = radVec.clone().normalize();
    const binormal = new THREE.Vector3(0, 0, 1);

    // Width along Z (hourglass waist pinch + flute)
    let wf = 1.0;
    if (s <= waistPosition) {
      const u = s / waistPosition;
      const k = u * u * (3 - 2 * u);
      wf = 1.0 + (shoulderPinch - 1.0) * k;
    } else {
      const u = (s - waistPosition) / (1.0 - waistPosition);
      const k = u * u * (3 - 2 * u);
      const fluteTarget = shoulderPinch * shoulderFlute;
      wf = shoulderPinch + (fluteTarget - shoulderPinch) * k;
    }
    const w = baseWidth * wf;

    for (let j = 0; j < crossSegments; j++) {
      const alpha = (j / crossSegments) * 2 * Math.PI;
      const cosA = Math.cos(alpha);
      const sinA = Math.sin(alpha);
      const nz = Math.abs(sinA);

      let z = (w / 2) * Math.sign(sinA) * Math.pow(nz, 0.88);

      // Split loop teardrop window
      if (taperStyle === 'harmony_split' && s > 0.12 && s < 0.88) {
        const uSplit = (s - 0.12) / 0.76;
        const splitEnv = Math.sin(Math.PI * Math.pow(uSplit, 0.9));
        const splitDist = (w / 2) * 0.55 * splitEnv;
        if (cosA >= -0.2) {
          z += (z >= 0 ? 1 : -1) * splitDist;
        }
      }

      let vert;
      if (cosA >= 0) {
        // Outer crest facing sky - anchored directly to ptOut on outer envelope!
        const kPeak = Math.pow(Math.max(0, 1.0 - nz), crestSharpness);
        // At s=0 (takeoff root): edge drop matches lower shank exactly: (baseThickness - edgeThickness)
        // Towards s=1 (head): softly rounds off into the gallery rail
        const edgeDrop = (baseThickness - edgeThickness) * (1.0 - s * 0.50);
        const drop = edgeDrop * (1.0 - kPeak * Math.pow(cosA, 0.90));
        vert = ptOut.clone()
          .add(binormal.clone().multiplyScalar(z))
          .sub(normal.clone().multiplyScalar(drop));
      } else {
        // Underside facing daylight aperture - anchored directly to ptIn!
        // At s=0, ptIn touches the bridge rail. As s increases, underside arches upward.
        const ceilingArch = 0.12 * Math.sin(Math.PI * (1.0 - nz)) * Math.pow(Math.abs(cosA), 0.85);
        vert = ptIn.clone()
          .add(binormal.clone().multiplyScalar(z))
          .add(normal.clone().multiplyScalar(ceilingArch));
      }

      positions.push(vert.x, vert.y, vert.z);
    }
  }

  // Tube indices
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < crossSegments; j++) {
      const nextJ = (j + 1) % crossSegments;
      const a = i * crossSegments + j;
      const b = (i + 1) * crossSegments + j;
      const c = (i + 1) * crossSegments + nextJ;
      const d = i * crossSegments + nextJ;

      if (side > 0) {
        indices.push(a, b, c);
        indices.push(a, c, d);
      } else {
        indices.push(a, c, b);
        indices.push(a, d, c);
      }
    }
  }

  // End Cap at s = 1.0 (basket junction) ONLY
  // No start cap at s = 0 because it seats seamlessly on top of bridge rail and shank
  const capEndIdx = positions.length / 3;
  const endMid = outerCurve.getPoint(1).add(innerCurve.getPoint(1)).multiplyScalar(0.5);
  if (side < 0) endMid.x = -endMid.x;
  positions.push(endMid.x, endMid.y, endMid.z);
  const lastRow = steps * crossSegments;
  for (let j = 0; j < crossSegments; j++) {
    const nextJ = (j + 1) % crossSegments;
    if (side > 0) {
      indices.push(capEndIdx, lastRow + j, lastRow + nextJ);
    } else {
      indices.push(capEndIdx, lastRow + nextJ, lastRow + j);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * 2. Monolithic Cathedral Band Geometry (Single continuous outer arch + flush bridge rail)
 */
export function createMonolithicCathedralBandGeometry(bandParams = CAD_STATE.band, headTargets = null) {
  const {
    ringSizeUS = 6.0,
    baseWidth = 2.40,
    baseThickness = 1.80,
    edgeThickness = 0.95,
    shoulderPinch = 0.62,
    shoulderFlute = 1.35,
    waistPosition = 0.45,
    cathedralRise = 0.90,
    crestSharpness = 1.55,
    comfortFit = 0.12,
    taperStyle = 'harmony_solid',
    takeoffAngleDeg = 38,
    bridgeThickness = 1.15,
    bridgeWidth = 1.85,
    stepsLower = 72,
    stepsShoulder = 32,
    crossSegments = 32
  } = bandParams;

  const innerDiameter = 11.63 + 0.8128 * ringSizeUS;
  const innerRadius = innerDiameter / 2;
  const takeoffRad = (takeoffAngleDeg * Math.PI) / 180;
  const theta0 = Math.PI / 2 - takeoffRad; // polar angle at takeoff (~52 deg)

  // Basket head targets
  const xJunction = headTargets ? headTargets.xJunction : 2.50;
  const yJunction = headTargets ? headTargets.yJunction : (innerRadius + bridgeThickness + 1.45);
  const xCollar = Math.max(1.10, xJunction - 0.95);
  const yCollar = innerRadius + bridgeThickness + 0.30;

  // Outer shoulder spline (right arm)
  const pOut0 = new THREE.Vector3(
    (innerRadius + baseThickness) * Math.cos(theta0),
    (innerRadius + baseThickness) * Math.sin(theta0),
    0
  );
  const pOut1 = new THREE.Vector3(xJunction, yJunction, 0);
  const tCircle = new THREE.Vector3(-Math.sin(theta0), Math.cos(theta0), 0).normalize();
  const tOut1 = new THREE.Vector3(-0.707, 0.707, 0).normalize();
  const distOut = pOut0.distanceTo(pOut1);
  const cOut1 = pOut0.clone().add(tCircle.clone().multiplyScalar(distOut * 0.44));
  const cOut2 = pOut1.clone().sub(tOut1.clone().multiplyScalar(distOut * 0.38)).add(new THREE.Vector3(0, cathedralRise * 0.16, 0));
  const shoulderOuterCurve = new THREE.CubicBezierCurve3(pOut0, cOut1, cOut2, pOut1);

  // Inner shoulder spline (ceiling of daylight window)
  const pIn0 = new THREE.Vector3(
    (innerRadius + bridgeThickness) * Math.cos(theta0),
    (innerRadius + bridgeThickness) * Math.sin(theta0),
    0
  );
  const pIn1 = new THREE.Vector3(xCollar, yCollar, 0);
  const distIn = pIn0.distanceTo(pIn1);
  const tIn1 = new THREE.Vector3(-0.85, 0.52, 0).normalize();
  const cIn1 = pIn0.clone().add(tCircle.clone().multiplyScalar(distIn * 0.42));
  const cIn2 = pIn1.clone().sub(tIn1.clone().multiplyScalar(distIn * 0.35));
  const shoulderInnerCurve = new THREE.CubicBezierCurve3(pIn0, cIn1, cIn2, pIn1);

  // Total half steps from palm (step 0) to gallery rail (step stepsHalf)
  const stepsLowerHalf = Math.floor(stepsLower / 2);
  const stepsHalf = stepsLowerHalf + stepsShoulder;
  const totalRings = stepsHalf * 2 + 1;

  const positions = [];
  const indices = [];

  // Ring indices from -stepsHalf (left head) to 0 (palm) to +stepsHalf (right head)
  for (let k = -stepsHalf; k <= stepsHalf; k++) {
    const side = k >= 0 ? 1 : -1;
    const stepIdx = Math.abs(k);

    let pOut = new THREE.Vector3();
    let pIn = new THREE.Vector3();
    let w = baseWidth;
    let sShoulder = 0;
    let isShoulder = false;

    if (stepIdx <= stepsLowerHalf) {
      // Lower circular shank: sweeps from palm (-pi/2) to takeoff (theta0)
      const u = stepIdx / stepsLowerHalf;
      const theta = -Math.PI / 2 + u * (theta0 - (-Math.PI / 2));
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      pIn.set(innerRadius * cosT, innerRadius * sinT, 0);
      pOut.set((innerRadius + baseThickness) * cosT, (innerRadius + baseThickness) * sinT, 0);

      // Subtle palm taper
      w = baseWidth * (1.0 - 0.05 * u);
    } else {
      // Cathedral shoulder: sweeps from takeoff to gallery rail
      isShoulder = true;
      sShoulder = (stepIdx - stepsLowerHalf) / stepsShoulder;
      pOut.copy(shoulderOuterCurve.getPoint(sShoulder));
      pIn.copy(shoulderInnerCurve.getPoint(sShoulder));

      // Hourglass waist pinch + flute
      let wf = 1.0;
      if (sShoulder <= waistPosition) {
        const u = sShoulder / waistPosition;
        const hermite = u * u * (3 - 2 * u);
        wf = 1.0 + (shoulderPinch - 1.0) * hermite;
      } else {
        const u = (sShoulder - waistPosition) / (1.0 - waistPosition);
        const hermite = u * u * (3 - 2 * u);
        const fluteTarget = shoulderPinch * shoulderFlute;
        wf = shoulderPinch + (fluteTarget - shoulderPinch) * hermite;
      }
      w = baseWidth * wf;
    }

    if (side < 0) {
      pOut.x = -pOut.x;
      pIn.x = -pIn.x;
    }

    const radVec = pOut.clone().sub(pIn);
    const h = Math.max(0.08, radVec.length());
    const normal = radVec.clone().normalize();
    const midPt = pOut.clone().add(pIn).multiplyScalar(0.5);
    const binormal = new THREE.Vector3(0, 0, 1);

    for (let j = 0; j < crossSegments; j++) {
      const alpha = (j / crossSegments) * 2 * Math.PI;
      const cosA = Math.cos(alpha);
      const sinA = Math.sin(alpha);
      const nz = Math.abs(sinA);

      let z = (w / 2) * Math.sign(sinA) * Math.pow(nz, 0.88);

      if (taperStyle === 'harmony_split' && isShoulder && sShoulder > 0.12 && sShoulder < 0.88) {
        const uSplit = (sShoulder - 0.12) / 0.76;
        const splitEnv = Math.sin(Math.PI * Math.pow(uSplit, 0.9));
        const splitDist = (w / 2) * 0.55 * splitEnv;
        if (cosA >= -0.2) {
          z += (z >= 0 ? 1 : -1) * splitDist;
        }
      }

      let rRad = 0;
      if (cosA >= 0) {
        const kPeak = Math.pow(Math.max(0, 1.0 - nz), crestSharpness);
        if (!isShoulder) {
          const edgeFactor = edgeThickness / baseThickness;
          rRad = (h / 2) * (edgeFactor + (1.0 - edgeFactor) * kPeak) * Math.pow(cosA, 0.88);
        } else {
          const edgeFactor = (1.0 - sShoulder) * (edgeThickness / baseThickness) + sShoulder * 0.45;
          rRad = (h / 2) * (edgeFactor + (1.0 - edgeFactor) * kPeak) * Math.pow(cosA, 0.88);
        }
      } else {
        if (!isShoulder) {
          rRad = (h / 2) * cosA;
          if (nz < 0.85) {
            rRad += comfortFit * (1.0 - (nz / 0.85) * (nz / 0.85)) * Math.pow(Math.abs(cosA), 0.85);
          }
        } else {
          rRad = (h / 2) * cosA;
        }
      }

      const vert = midPt.clone()
        .add(binormal.clone().multiplyScalar(z))
        .add(normal.clone().multiplyScalar(rRad));

      positions.push(vert.x, vert.y, vert.z);
    }
  }

  // Quads along monolithic arch
  for (let i = 0; i < totalRings - 1; i++) {
    for (let j = 0; j < crossSegments; j++) {
      const nextJ = (j + 1) % crossSegments;
      const a = i * crossSegments + j;
      const b = (i + 1) * crossSegments + j;
      const c = (i + 1) * crossSegments + nextJ;
      const d = i * crossSegments + nextJ;

      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }

  // Cap at Left Head (i = 0)
  const capLeftIdx = positions.length / 3;
  const leftMid = new THREE.Vector3(-xJunction, yJunction, 0);
  positions.push(leftMid.x, leftMid.y, leftMid.z);
  for (let j = 0; j < crossSegments; j++) {
    const nextJ = (j + 1) % crossSegments;
    indices.push(capLeftIdx, nextJ, j);
  }

  // Cap at Right Head (i = totalRings - 1)
  const capRightIdx = positions.length / 3;
  const rightMid = new THREE.Vector3(xJunction, yJunction, 0);
  positions.push(rightMid.x, rightMid.y, rightMid.z);
  const lastRingStart = (totalRings - 1) * crossSegments;
  for (let j = 0; j < crossSegments; j++) {
    const nextJ = (j + 1) % crossSegments;
    indices.push(capRightIdx, lastRingStart + j, lastRingStart + nextJ);
  }

  const archGeom = new THREE.BufferGeometry();
  archGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  archGeom.setIndex(indices);
  archGeom.computeVertexNormals();

  // -------------------------------------------------------------
  // Bridge Rail: Clean arc spanning between left and right takeoff
  // -------------------------------------------------------------
  const bridgePositions = [];
  const bridgeIndices = [];
  const bridgeSteps = 28;

  for (let i = 0; i <= bridgeSteps; i++) {
    const u = i / bridgeSteps;
    // Angle from left takeoff (pi - theta0) to right takeoff (theta0)
    const theta = (Math.PI - theta0) - u * ((Math.PI - theta0) - theta0);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const midR = innerRadius + bridgeThickness / 2;
    const centerPt = new THREE.Vector3(midR * cosT, midR * sinT, 0);
    const normal = new THREE.Vector3(cosT, sinT, 0);
    const binormal = new THREE.Vector3(0, 0, 1);

    for (let j = 0; j < crossSegments; j++) {
      const alpha = (j / crossSegments) * 2 * Math.PI;
      const cosA = Math.cos(alpha);
      const sinA = Math.sin(alpha);
      const nz = Math.abs(sinA);

      const z = (bridgeWidth / 2) * Math.sign(sinA) * Math.pow(nz, 0.88);
      let rRad = (bridgeThickness / 2) * cosA;

      if (cosA < 0 && nz < 0.85) {
        // Comfort fit on finger underside
        rRad += comfortFit * (1.0 - (nz / 0.85) * (nz / 0.85)) * Math.pow(Math.abs(cosA), 0.85);
      }

      const vert = centerPt.clone()
        .add(binormal.clone().multiplyScalar(z))
        .add(normal.clone().multiplyScalar(rRad));

      bridgePositions.push(vert.x, vert.y, vert.z);
    }
  }

  for (let i = 0; i < bridgeSteps; i++) {
    for (let j = 0; j < crossSegments; j++) {
      const nextJ = (j + 1) % crossSegments;
      const a = i * crossSegments + j;
      const b = (i + 1) * crossSegments + j;
      const c = (i + 1) * crossSegments + nextJ;
      const d = i * crossSegments + nextJ;

      bridgeIndices.push(a, b, c);
      bridgeIndices.push(a, c, d);
    }
  }

  const bridgeGeom = new THREE.BufferGeometry();
  bridgeGeom.setAttribute('position', new THREE.Float32BufferAttribute(bridgePositions, 3));
  bridgeGeom.setIndex(bridgeIndices);
  bridgeGeom.computeVertexNormals();

  return mergeBufferGeometries([archGeom, bridgeGeom]);
}

/**
 * 2. Parametric Tiffany Harmony Band Geometry
 */
export function createHarmonyBandGeometry(bandParams = CAD_STATE.band, headParams = CAD_STATE.head, headTargets = null) {
  if (bandParams.taperStyle === 'classic_taper') {
    // Non-cathedral single loop
    return createLowerShankAndBridgeGeometry({ ...bandParams, takeoffAngleDeg: 10 });
  }

  const gShank = createLowerShankAndBridgeGeometry(bandParams);
  const gRight = createCathedralShoulderGeometry(1, bandParams, headTargets);
  const gLeft = createCathedralShoulderGeometry(-1, bandParams, headTargets);

  return mergeBufferGeometries([gShank, gRight, gLeft]);
}

/**
 * 3. Parametric Head & Basket Geometry (Tiffany Harmony Cathedral Basket)
 */
export function createHeadGeometry(
  headParams = CAD_STATE.head,
  bandParams = CAD_STATE.band,
  stoneParams = CAD_STATE.stone
) {
  const {
    prongCount = 6,
    prongStyle = 'claw',
    headStyle = 'harmony_basket',
    prongThickness = 0.85,
    clawReach = 0.35,
    galleryRail = true,
    railThickness = 0.65,
    baseCollar = true,
    collarThickness = 0.70,
    collarRadius = 1.65,
  } = headParams;

  const innerDiameter = 11.63 + 0.8128 * bandParams.ringSizeUS;
  const innerRadius = innerDiameter / 2;

  const stoneDia = stoneParams.diameter;
  const stonePavilion = stoneDia * stoneParams.pavilionDepthRatio;
  const stoneCrown = stoneDia * stoneParams.crownHeightRatio;

  // Base collar rests directly atop the finger bridge rail
  const bridgeThickness = bandParams.bridgeThickness || 1.15;
  const yCollar = innerRadius + bridgeThickness + (collarThickness / 2);
  const yGirdle = yCollar + stonePavilion + (stoneParams.sinkOffset || 0);
  const yCrown = yGirdle + stoneCrown * 0.40;

  const rGirdle = stoneDia / 2;
  const rCollar = collarRadius;
  const rRail = (rCollar + rGirdle) * 0.58;
  const yRail = (yCollar + yGirdle) * 0.50;

  const geometries = [];

  // Prongs
  for (let i = 0; i < prongCount; i++) {
    const angle = prongCount === 6
      ? (i * Math.PI) / 3 + Math.PI / 6
      : (i * Math.PI) / 2 + Math.PI / 4;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    let p0, p1, p2, p3;

    if (headStyle === 'tulip_petal') {
      p0 = new THREE.Vector3(rCollar * cosA, yCollar, rCollar * sinA);
      p1 = new THREE.Vector3(rRail * 1.30 * cosA, (yCollar + yRail) * 0.48, rRail * 1.30 * sinA);
      p2 = new THREE.Vector3((rGirdle + 0.10) * cosA, yGirdle, (rGirdle + 0.10) * sinA);
      p3 = new THREE.Vector3((rGirdle - clawReach) * cosA, yCrown, (rGirdle - clawReach) * sinA);
    } else {
      p0 = new THREE.Vector3(rCollar * cosA, yCollar, rCollar * sinA);
      p1 = new THREE.Vector3(rRail * 1.04 * cosA, yRail, rRail * 1.04 * sinA);
      p2 = new THREE.Vector3((rGirdle + 0.08) * cosA, yGirdle, (rGirdle + 0.08) * sinA);
      p3 = new THREE.Vector3((rGirdle - clawReach) * cosA, yCrown, (rGirdle - clawReach) * sinA);
    }

    const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3);
    const tubeGeom = new THREE.TubeGeometry(curve, 28, prongThickness / 2, 12, false);
    geometries.push(tubeGeom);

    // Jeweler Claw Prongs
    if (prongStyle === 'claw') {
      const tipLength = prongThickness * 1.05;
      const coneGeom = new THREE.ConeGeometry((prongThickness / 2) * 0.95, tipLength, 16);
      const inwardVec = new THREE.Vector3(-cosA, -0.30, -sinA).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), inwardVec);
      coneGeom.applyQuaternion(quat);
      coneGeom.translate(
        p3.x + inwardVec.x * (tipLength * 0.40),
        p3.y + inwardVec.y * (tipLength * 0.40),
        p3.z + inwardVec.z * (tipLength * 0.40)
      );
      geometries.push(coneGeom);
    } else {
      // Round Bead Tip
      const sphereCap = new THREE.SphereGeometry(prongThickness / 2, 16, 16);
      sphereCap.translate(p3.x, p3.y, p3.z);
      geometries.push(sphereCap);
    }
  }

  // Gallery Rail (Mid-Pavilion Stabilizer Ring)
  if (galleryRail) {
    const railCurve = new THREE.EllipseCurve(0, 0, rRail, rRail, 0, 2 * Math.PI, false, 0);
    const railPts = railCurve.getPoints(48).map(p => new THREE.Vector3(p.x, yRail, p.y));
    const railSpline = new THREE.CatmullRomCurve3(railPts, true);
    const railTube = new THREE.TubeGeometry(railSpline, 48, railThickness / 2, 8, true);
    geometries.push(railTube);
  }

  // Base Collar Ring (Open Donut Gallery)
  if (baseCollar) {
    const collarCurve = new THREE.EllipseCurve(0, 0, rCollar, rCollar, 0, 2 * Math.PI, false, 0);
    const collarPts = collarCurve.getPoints(36).map(p => new THREE.Vector3(p.x, yCollar, p.y));
    const collarSpline = new THREE.CatmullRomCurve3(collarPts, true);
    const collarTube = new THREE.TubeGeometry(collarSpline, 36, collarThickness / 2, 8, true);
    geometries.push(collarTube);
  }

  return {
    geometries,
    yGirdle,
    yCollar,
    headTargets: {
      xJunction: rRail * 0.95,
      yJunction: yRail
    }
  };
}

/**
 * 4. Volume and Weight Calculation
 */
export function computeGeometryVolume(geometry) {
  const position = geometry.attributes.position;
  const index = geometry.index;
  const faces = index ? index.count / 3 : position.count / 3;
  let volume = 0;
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const p3 = new THREE.Vector3();

  for (let i = 0; i < faces; i++) {
    const i1 = index ? index.getX(i * 3 + 0) : i * 3 + 0;
    const i2 = index ? index.getX(i * 3 + 1) : i * 3 + 1;
    const i3 = index ? index.getX(i * 3 + 2) : i * 3 + 2;

    p1.fromBufferAttribute(position, i1);
    p2.fromBufferAttribute(position, i2);
    p3.fromBufferAttribute(position, i3);

    volume += p1.dot(p2.cross(p3)) / 6.0;
  }
  return Math.abs(volume);
}

// --- Main CAD App Controller ---
export class RingCADStudio {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.state = CAD_STATE;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    this.bandMesh = null;
    this.headGroup = null;
    this.stoneMesh = null;

    this.metalMaterial = null;
    this.stoneMaterial = null;

    this.init();
  }

  init() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0d14);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    this.camera.position.set(0, 18, 42);

    // 3. Renderer with PBR Studio Lighting
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.30;

    // Environment Map
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;

    // Studio Lights
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(20, 40, 30);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.6);
    fillLight.position.set(-25, 20, -20);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
    rimLight.position.set(0, -30, 20);
    this.scene.add(rimLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambient);

    // 4. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 120;
    this.controls.target.set(0, 8, 0);

    // 5. Materials
    this.updateMaterials();

    // 6. Ring Assembly Group
    this.ringGroup = new THREE.Group();
    this.scene.add(this.ringGroup);

    // 7. Build Initial 3D Model
    this.rebuildModel();

    // 8. Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());

    // 9. Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  updateMaterials() {
    const spec = METAL_SPECS[this.state.metal.alloy] || METAL_SPECS.pt950;
    const roughness = this.state.metal.finish === 'satin' ? 0.35 : spec.roughness;

    if (!this.metalMaterial) {
      this.metalMaterial = new THREE.MeshStandardMaterial({
        color: spec.color,
        metalness: spec.metalness,
        roughness: roughness,
        envMapIntensity: spec.envIntensity,
      });
    } else {
      this.metalMaterial.color.setHex(spec.color);
      this.metalMaterial.metalness = spec.metalness;
      this.metalMaterial.roughness = roughness;
      this.metalMaterial.envMapIntensity = spec.envIntensity;
      this.metalMaterial.needsUpdate = true;
    }

    if (!this.stoneMaterial) {
      this.stoneMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.0,
        transmission: 0.98,
        ior: 2.417,
        thickness: 4.0,
        dispersion: 0.044,
        specularColor: 0xffffff,
        envMapIntensity: 3.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        flatShading: true, // Planar facet scintillation
      });
    }
  }

  rebuildModel() {
    // 1. Clear previous children from ringGroup
    while (this.ringGroup.children.length > 0) {
      const child = this.ringGroup.children[0];
      this.ringGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.traverse) {
        child.traverse(c => {
          if (c.geometry) c.geometry.dispose();
        });
      }
    }
    this.bandMesh = null;
    this.headGroup = null;
    this.stoneMesh = null;

    // 2. Build Head & Prongs (obtaining exact junction targets for cathedral arms)
    const { geometries, yGirdle, headTargets } = createHeadGeometry(this.state.head, this.state.band, this.state.stone);
    this.headGroup = new THREE.Group();
    geometries.forEach(geom => {
      const mesh = new THREE.Mesh(geom, this.metalMaterial);
      this.headGroup.add(mesh);
    });
    this.ringGroup.add(this.headGroup);

    // 3. Build Band (fusing seamlessly with headTargets at gallery rail)
    const bandGeom = createHarmonyBandGeometry(this.state.band, this.state.head, headTargets);
    this.bandMesh = new THREE.Mesh(bandGeom, this.metalMaterial);
    this.ringGroup.add(this.bandMesh);

    // 4. Build Diamond 1 (OEC)
    const stoneGeom = createOECDiamondGeometry(this.state.stone);
    this.stoneMesh = new THREE.Mesh(stoneGeom, this.stoneMaterial);
    this.stoneMesh.position.set(0, yGirdle, 0);
    this.ringGroup.add(this.stoneMesh);

    // 5. Update CAD Physical Stats & HUD
    this.updateCadStats();
  }

  updateCadStats() {
    if (!this.bandMesh) return;

    let totalVolume = computeGeometryVolume(this.bandMesh.geometry);
    if (this.headGroup) {
      this.headGroup.traverse(child => {
        if (child.geometry) totalVolume += computeGeometryVolume(child.geometry);
      });
    }

    const spec = METAL_SPECS[this.state.metal.alloy] || METAL_SPECS.pt950;
    const weightGrams = (totalVolume / 1000) * spec.density;

    const innerDia = 11.63 + 0.8128 * this.state.band.ringSizeUS;
    const innerCircum = innerDia * Math.PI;

    // Update DOM indicators
    const volElem = document.getElementById('stat-volume');
    const wtElem = document.getElementById('stat-weight');
    const diaElem = document.getElementById('stat-inner-dia');
    const circumElem = document.getElementById('stat-circumference');

    if (volElem) volElem.innerText = totalVolume.toFixed(1) + ' mm³';
    if (wtElem) wtElem.innerText = weightGrams.toFixed(2) + ' g (' + spec.name.split(' ')[0] + ')';
    if (diaElem) diaElem.innerText = innerDia.toFixed(2) + ' mm';
    if (circumElem) circumElem.innerText = innerCircum.toFixed(1) + ' mm';

    // HUD Calipers
    const hudDia = document.getElementById('hud-inner-dia');
    const hudWidth = document.getElementById('hud-band-width');
    const hudStone = document.getElementById('hud-stone-dia');
    const hudWaist = document.getElementById('hud-waist-width');
    const hudFlute = document.getElementById('hud-flute-width');
    const hudLift = document.getElementById('hud-setting-height');

    const waistMm = this.state.band.baseWidth * this.state.band.shoulderPinch;
    const fluteMm = waistMm * this.state.band.shoulderFlute;
    const settingHeight = this.state.head.bridgeClearance + this.state.stone.depth + (this.state.stone.sinkOffset || 0);

    if (hudDia) hudDia.innerText = innerDia.toFixed(2) + ' mm';
    if (hudWidth) hudWidth.innerText = this.state.band.baseWidth.toFixed(2) + ' mm';
    if (hudStone) hudStone.innerText = this.state.stone.diameter.toFixed(2) + ' mm';
    if (hudWaist) hudWaist.innerText = waistMm.toFixed(2) + ' mm';
    if (hudFlute) hudFlute.innerText = fluteMm.toFixed(2) + ' mm';
    if (hudLift) hudLift.innerText = settingHeight.toFixed(2) + ' mm';
  }

  setCameraView(viewName) {
    const targetY = 8;
    this.controls.target.set(0, targetY, 0);

    if (viewName === 'top') {
      this.camera.position.set(0, 42, 0.001);
    } else if (viewName === 'side') {
      this.camera.position.set(0, targetY, 38);
    } else if (viewName === 'profile') {
      this.camera.position.set(38, targetY, 0);
    } else if (viewName === 'perspective') {
      this.camera.position.set(22, 22, 28);
    } else if (viewName === 'macro') {
      this.controls.target.set(0, 12, 0);
      this.camera.position.set(6, 15, 10);
    }
    this.controls.update();
  }

  exportSTL() {
    const exporter = new STLExporter();
    const exportGroup = new THREE.Group();

    if (this.bandMesh) exportGroup.add(this.bandMesh.clone());
    if (this.headGroup) exportGroup.add(this.headGroup.clone());

    const result = exporter.parse(exportGroup, { binary: true });
    const blob = new Blob([result], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Tiffany_Harmony_6Prong_Ring_Size' + this.state.band.ringSizeUS + '.stl';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  exportGLTF() {
    const exporter = new GLTFExporter();
    const exportGroup = new THREE.Group();
    if (this.bandMesh) exportGroup.add(this.bandMesh.clone());
    if (this.headGroup) exportGroup.add(this.headGroup.clone());
    if (this.stoneMesh) exportGroup.add(this.stoneMesh.clone());

    exporter.parse(
      exportGroup,
      (gltf) => {
        const output = JSON.stringify(gltf, null, 2);
        const blob = new Blob([output], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Tiffany_Harmony_6Prong_Diamond1.gltf';
        link.click();
        URL.revokeObjectURL(link.href);
      },
      (error) => console.error('An error occurred while exporting GLTF:', error)
    );
  }

  exportOBJ() {
    const exporter = new OBJExporter();
    const exportGroup = new THREE.Group();
    if (this.bandMesh) exportGroup.add(this.bandMesh.clone());
    if (this.headGroup) exportGroup.add(this.headGroup.clone());
    if (this.stoneMesh) exportGroup.add(this.stoneMesh.clone());

    const result = exporter.parse(exportGroup);
    const blob = new Blob([result], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Tiffany_Harmony_6Prong_Ring.obj';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  takeSnapshot() {
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'Tiffany_Harmony_Diamond1_Render_' + Date.now() + '.png';
    link.click();
  }

  onWindowResize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(this.animate);
    if (this.state.viewport.autoRotate && this.ringGroup) {
      this.ringGroup.rotation.y += 0.005 * this.state.viewport.autoRotateSpeed;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
