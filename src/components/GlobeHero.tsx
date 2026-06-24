import { useRef, useEffect, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Line } from "@react-three/drei";
import * as THREE from "three";

interface CountryFeature {
  type: "Feature";
  geometry: {
    type: "MultiPolygon" | "Polygon";
    coordinates: any;
  };
  properties: { NAME?: string; name?: string };
}

const GLOBE_RADIUS = 1.005;

function convertCoordinates(lon: number, lat: number) {
  // Three.js uses a left-handed longitude orientation here, so negate lon.
  const phi = THREE.MathUtils.degToRad(-lon);
  const theta = THREE.MathUtils.degToRad(90 - lat);
  return new THREE.Vector3(
    GLOBE_RADIUS * Math.sin(theta) * Math.cos(phi),
    GLOBE_RADIUS * Math.cos(theta),
    GLOBE_RADIUS * Math.sin(theta) * Math.sin(phi),
  );
}

function GlobeCountries() {
  const [countries, setCountries] = useState<CountryFeature[]>([]);

  useEffect(() => {
    fetch("/countries-110m.geojson")
      .then((r) => r.json())
      .then((data) => setCountries(data.features || []))
      .catch(() => setCountries([]));
  }, []);

  return (
    <group>
      {countries.map((country, i) => {
        const coords =
          country.geometry.type === "MultiPolygon" ? country.geometry.coordinates : [country.geometry.coordinates];

        return coords.flatMap((polygon: number[][][], pi: number) =>
          polygon.map((ring: number[][], ri: number) => {
            const positions = ring.map(([lon, lat]) => convertCoordinates(lon, lat));
            if (positions.length < 2) return null;
            return (
              <Line
                key={`${i}-${pi}-${ri}`}
                points={positions}
                color="#7dd3fc"
                lineWidth={0.6}
                transparent
                opacity={0.55}
              />
            );
          }),
        );
      })}
    </group>
  );
}

function DataArcs() {
  const arcs = useMemo(() => {
    const routes = [
      [121.774, 12.8797, 103.8198, 1.3521],
      [121.774, 12.8797, 139.6917, 35.6895],
      [121.774, 12.8797, 151.2093, -33.8688],
      [121.774, 12.8797, -122.4194, 37.7749],
      [121.774, 12.8797, 77.209, 28.6139],
    ];

    return routes.map(([fromLon, fromLat, toLon, toLat]) => {
      const start = convertCoordinates(fromLon, fromLat);
      const end = convertCoordinates(toLon, toLat);
      const points = Array.from({ length: 36 }, (_, index) => {
        const t = index / 35;
        const lift = Math.sin(t * Math.PI) * 0.34;
        return start
          .clone()
          .lerp(end, t)
          .normalize()
          .multiplyScalar(GLOBE_RADIUS + 0.03 + lift);
      });

      return points;
    });
  }, []);

  return (
    <group>
      {arcs.map((points, index) => (
        <Line
          key={index}
          points={points}
          color={index % 2 === 0 ? "#a7f3d0" : "#bae6fd"}
          lineWidth={1.15}
          transparent
          opacity={0.62}
        />
      ))}
    </group>
  );
}

function StarField() {
  const positions = useMemo(() => {
    const points = new Float32Array(360);
    for (let i = 0; i < points.length; i += 3) {
      const radius = 3.2 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      points[i] = radius * Math.sin(phi) * Math.cos(theta);
      points[i + 1] = radius * Math.cos(phi);
      points[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    return points;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        color="#e0f2fe"
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  );
}

function Globe() {
  const groupRef = useRef<THREE.Group>(null);
  const phLon = 121.774; // Philippines longitude (DepEd context)
  const scrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      scrollY.current = window.scrollY || 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame(({ clock, camera }) => {
    if (groupRef.current) {
      const progress = Math.min(scrollY.current / 2400, 1);
      const scrollOffset = scrollY.current * 0.0009;
      groupRef.current.rotation.y = THREE.MathUtils.degToRad(phLon) + clock.getElapsedTime() * 0.045 + scrollOffset;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(0.06, -0.18, progress);
      groupRef.current.position.x = THREE.MathUtils.lerp(0.38, -0.22, progress);
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(1.18, 0.92, progress));
      camera.position.z = THREE.MathUtils.lerp(2.28, 2.72, progress);
      camera.position.x = THREE.MathUtils.lerp(-0.1, 0.18, progress);
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[1, 64, 64]}>
        <meshPhongMaterial
          color="#071526"
          emissive="#0a1830"
          shininess={18}
          specular="#38bdf8"
          transparent
          opacity={0.96}
        />
      </Sphere>
      <GlobeCountries />
      <DataArcs />
      <mesh rotation={[Math.PI / 2.1, 0.2, 0.1]}>
        <torusGeometry args={[1.24, 0.004, 12, 160]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.18} />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, -0.6, 0.4]}>
        <torusGeometry args={[1.36, 0.003, 12, 160]} />
        <meshBasicMaterial color="#a7f3d0" transparent opacity={0.12} />
      </mesh>
      {/* subtle atmospheric outer sphere */}
      <Sphere args={[1.04, 64, 64]}>
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.075} side={THREE.BackSide} />
      </Sphere>
    </group>
  );
}

export function GlobeHero() {
  return (
    <div
      aria-hidden
      className="registry-globe-canvas fixed left-0 right-0 bottom-0 w-screen overflow-hidden bg-[#030712] pointer-events-none"
      style={{ zIndex: -10, top: "4rem", height: "calc(100vh - 4rem)" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 62% 44%, rgba(56,189,248,0.22) 0%, rgba(15,23,42,0) 48%), radial-gradient(ellipse at 34% 74%, rgba(16,185,129,0.12) 0%, rgba(3,7,18,0) 45%), linear-gradient(180deg, #030712 0%, #020617 100%)",
        }}
      />
      <Canvas
        className="!absolute !inset-0"
        camera={{ position: [-0.1, 0, 2.28], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.58} />
        <directionalLight position={[4, 3, 5]} intensity={1.05} />
        <pointLight position={[-3, -1, 2]} intensity={0.95} color="#34d399" />
        <Suspense fallback={null}>
          <StarField />
          <Globe />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}

export default GlobeHero;
