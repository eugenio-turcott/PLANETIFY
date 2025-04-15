import React, { useState, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import { a, useSpring, config } from "@react-spring/three";
import PropTypes from "prop-types";

const createVerticalGradientTexture = (colors) => {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  colors.forEach((color, index) => {
    gradient.addColorStop(
      index / (colors.length - 1),
      `rgb(${color.join(",")})`
    );
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
};

const fragmentShader = `
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform float mixRatio;
varying vec2 vUv;

void main() {
  vec4 tex1 = texture2D(texture1, vUv);
  vec4 tex2 = texture2D(texture2, vUv);
  gl_FragColor = mix(tex1, tex2, mixRatio);
}
`;

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const calculateLuminosity = (color) => {
  const [r, g, b] = color;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const findLightestColors = (colors) => {
  return colors
    .sort((a, b) => calculateLuminosity(b) - calculateLuminosity(a))
    .slice(0, 3);
};

const Planet = ({ colors, hasRings, planetInclination }) => {
  const planetRef = useRef();
  const ringRef = useRef();

  const [texture1, setTexture1] = useState(
    createVerticalGradientTexture(colors)
  );
  const [texture2, setTexture2] = useState(texture1);

  const lightestColors = useMemo(() => findLightestColors(colors), [colors]);
  const randomLightestColor = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * lightestColors.length);
    return lightestColors[randomIndex];
  }, [lightestColors]);

  const [spring, api] = useSpring(() => ({
    mixRatio: 0,
    ringColor: `rgb(${randomLightestColor.join(",")})`,
    config: { duration: 1000, ...config.default },
  }));

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          texture1: { value: texture1 },
          texture2: { value: texture2 },
          mixRatio: { value: 0 },
        },
        vertexShader,
        fragmentShader,
      }),
    [texture1, texture2]
  );

  const rotationSpeed = useMemo(() => Math.random() * 0.02, []);

  useFrame(() => {
    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed;
      planetRef.current.rotation.z =
        THREE.MathUtils.degToRad(planetInclination);
    }
    material.uniforms.mixRatio.value = spring.mixRatio.get();
  });

  useEffect(() => {
    const newTexture = createVerticalGradientTexture(colors);
    setTexture2(newTexture);

    api.start({ mixRatio: 1, ringColor: `rgb(${colors[0].join(",")})` });

    const timeoutId = setTimeout(() => {
      setTexture1(newTexture);
      api.set({ mixRatio: 0 });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [colors, api]);

  return (
    <a.mesh ref={planetRef} material={material}>
      <sphereGeometry args={[1, 64, 64]} />
      {hasRings && (
        <a.mesh ref={ringRef} rotation={[THREE.MathUtils.degToRad(90), 0, 0]}>
          <ringGeometry args={[1.25, 2, 64]} />
          <a.meshStandardMaterial
            color={spring.ringColor}
            metalness={0}
            roughness={1}
            side={THREE.DoubleSide}
          />
        </a.mesh>
      )}
    </a.mesh>
  );
};

Planet.propTypes = {
  colors: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  hasRings: PropTypes.bool,
  planetInclination: PropTypes.number,
};

const FixedCamera = ({ hasRings }) => {
  const { camera } = useThree();

  useMemo(() => {
    camera.position.set(0, 0, 10);
    camera.fov = hasRings ? 25 : 12.5;
    camera.updateProjectionMatrix();
  }, [camera, hasRings]);

  return null;
};

FixedCamera.propTypes = {
  hasRings: PropTypes.bool.isRequired,
};

const PlanetDemo = ({
  width,
  height,
  hasRings,
  planetInclination,
  colors,
  position,
  top,
  left,
  right,
  bottom,
}) => {
  return (
    <Canvas
      style={{
        position: position,
        width: `${width}px`,
        height: `${height}px`,
        top: top,
        left: left,
        right: right,
        bottom: bottom,
      }}
    >
      <FixedCamera hasRings={hasRings} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <spotLight
        position={[15, 15, 15]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        castShadow
      />
      <Planet
        colors={colors}
        hasRings={hasRings}
        planetInclination={planetInclination}
      />
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
};

PlanetDemo.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  hasRings: PropTypes.bool,
  planetInclination: PropTypes.number,
  colors: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  position: PropTypes.string,
  top: PropTypes.string,
  left: PropTypes.string,
  right: PropTypes.string,
  bottom: PropTypes.string,
};

PlanetDemo.defaultProps = {
  width: 20,
  height: 20,
  planetInclination: 45,
};

export default PlanetDemo;
