import React, { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import { a, useSpring, config } from "@react-spring/three";
import PropTypes from "prop-types";

const generateRandomColors = (numColors) => {
  const colors = [];
  for (let i = 0; i < numColors; i++) {
    colors.push(
      `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(
        Math.random() * 256
      )}, ${Math.floor(Math.random() * 256)})`
    );
  }
  return colors;
};

const createVerticalGradientTexture = (colors) => {
  const size = 128; // Reducido a 512 para mejorar el rendimiento
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
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

const Planet = ({ hasRings, ringInclination }) => {
  const planetRef = useRef();
  const ringRef = useRef();
  const colorsRef = useRef(generateRandomColors(5));
  const [texture1, setTexture1] = useState(() =>
    createVerticalGradientTexture(colorsRef.current)
  );
  const [texture2, setTexture2] = useState(texture1);

  const [spring, api] = useSpring(() => ({
    mixRatio: 0,
    ringColor: colorsRef.current[0],
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      const newColors = generateRandomColors(5);
      const newTexture = createVerticalGradientTexture(newColors);

      setTexture2(newTexture);

      colorsRef.current = newColors;
      api.start({ mixRatio: 1, ringColor: newColors[0] });

      setTimeout(() => {
        setTexture1(newTexture);
        api.set({ mixRatio: 0 });
      }, 1000);
    }, 2500);

    return () => clearInterval(intervalId);
  }, [api]);

  const rotationSpeed = useMemo(() => Math.random() * 0.02, []);
  const planetInclination = useMemo(() => Math.random() * 90, []);

  useFrame(() => {
    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed;
      planetRef.current.rotation.z =
        THREE.MathUtils.degToRad(planetInclination);
    }
    material.uniforms.mixRatio.value = spring.mixRatio.get();
  });

  return (
    <a.mesh ref={planetRef} material={material}>
      <sphereGeometry args={[1, 64, 64]} />
      {hasRings && (
        <a.mesh ref={ringRef} rotation={[THREE.MathUtils.degToRad(90), 0, 0]}>
          <ringGeometry args={[1.25, 2, 64]} />
          <a.meshBasicMaterial
            color={spring.ringColor}
            side={THREE.DoubleSide}
          />
        </a.mesh>
      )}
    </a.mesh>
  );
};

Planet.propTypes = {
  hasRings: PropTypes.bool,
  ringInclination: PropTypes.number,
};

const PlanetCanvas = ({
  width,
  height,
  hasRings,
  position,
  top,
  left,
  right,
  bottom,
}) => {
  const randomInclination = useMemo(() => Math.random() * 90, []);

  return (
    <Canvas
      style={{
        position: position,
        width: `${width}vw`,
        height: `${height}vw`,
        top: top,
        left: left,
        right: right,
        bottom: bottom,
      }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Planet hasRings={hasRings} ringInclination={randomInclination} />
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
};

PlanetCanvas.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  hasRings: PropTypes.bool,
  position: PropTypes.string,
  top: PropTypes.string,
  left: PropTypes.string,
  right: PropTypes.string,
  bottom: PropTypes.string,
};

PlanetCanvas.defaultProps = {
  width: 20,
  height: 20,
  hasRings: true,
  position: "absolute",
  top: "auto",
  left: "auto",
  right: "auto",
  bottom: "auto",
};

export default PlanetCanvas;
