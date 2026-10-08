// Faisceaux de projecteurs derrière le titre : purement décoratifs.
export function StageLights({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 1280 760"
      preserveAspectRatio="xMidYMin slice"
    >
      <polygon points="250,0 330,0 640,760 -80,760" fill="#F5B82E" fillOpacity="0.07" />
      <polygon points="610,0 680,0 980,760 380,760" fill="#C81E1E" fillOpacity="0.1" />
      <polygon points="960,0 1040,0 1400,760 760,760" fill="#F5B82E" fillOpacity="0.06" />
      <circle cx="290" cy="0" r="40" fill="#F5B82E" fillOpacity="0.35" />
      <circle cx="645" cy="0" r="40" fill="#C81E1E" fillOpacity="0.45" />
      <circle cx="1000" cy="0" r="40" fill="#F5B82E" fillOpacity="0.3" />
    </svg>
  )
}
