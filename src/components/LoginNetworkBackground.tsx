import React from "react";
import "./LoginNetworkBackground.css";

type Point = Readonly<{ x: number; y: number }>;

const buildMesh = (
  columns: number,
  rows: number,
  originX: number,
  originY: number,
  stepX: number,
  stepY: number,
  seed: number
) => {
  const nodes: Point[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const offsetX = Math.sin((col + seed) * 2.13 + row * 0.87) * stepX * 0.24;
      const offsetY = Math.cos((row + seed) * 1.73 + col * 1.17) * stepY * 0.25;
      nodes.push({
        x: Math.round(originX + col * stepX + offsetX),
        y: Math.round(originY + row * stepY + offsetY),
      });
    }
  }

  // Uma única geometria SVG por malha; nenhum cálculo/animador por quadro.
  const connections: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const current = nodes[row * columns + col];
      const connect = (targetRow: number, targetCol: number) => {
        const target = nodes[targetRow * columns + targetCol];
        connections.push(`M${current.x} ${current.y}L${target.x} ${target.y}`);
      };
      if (col + 1 < columns) connect(row, col + 1);
      if (row + 1 < rows) connect(row + 1, col);
      if (row + 1 < rows && col + 1 < columns && (row + col) % 3 !== 0) {
        connect(row + 1, col + 1);
      }
      if (row + 1 < rows && col > 0 && (row + col) % 5 === 0) {
        connect(row + 1, col - 1);
      }
    }
  }
  return { nodes, path: connections.join(" ") };
};

// Malhas estáticas e determinísticas calculadas uma vez no carregamento do módulo.
const leftMesh = buildMesh(7, 7, -90, 10, 95, 105, 1);
const rightMesh = buildMesh(8, 7, 855, 190, 97, 101, 7);

const Mesh: React.FC<{
  mesh: ReturnType<typeof buildMesh>;
  className: string;
}> = ({ mesh, className }) => (
  <g className={className}>
    <path d={mesh.path} fill="none" stroke="currentColor" strokeWidth="1.15" />
    {mesh.nodes.filter((_, index) => index % 3 === 0).map((point, index) => (
      <circle key={index} cx={point.x} cy={point.y} r={index % 4 === 0 ? 3.5 : 2.1} fill="currentColor" />
    ))}
  </g>
);

const LoginNetworkBackground: React.FC = () => (
  <div className="csae-login-background pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <span className="csae-login-background__glow" />
    <svg
      className="csae-login-background__network"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
    >
      <Mesh mesh={leftMesh} className="csae-login-network__web csae-login-network__web--left" />
      <Mesh mesh={rightMesh} className="csae-login-network__web csae-login-network__web--right" />
    </svg>
    <span className="csae-login-background__veil" />
  </div>
);

export default LoginNetworkBackground;
