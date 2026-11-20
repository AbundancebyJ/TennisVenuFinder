/**
 * 페이지 배경(코트 라인 + 스피드 라인)과 상단 히어로의 서브 애니메이션.
 * 순수 SVG + CSS 애니메이션(관절 회전)이라 외부 리소스가 필요 없음.
 * 움직임 줄이기 설정(prefers-reduced-motion)에서는 정지 화면으로 표시.
 *
 * 선수는 왼쪽을 향해 서브. 각도는 "아래 방향 = 0°, 시계 방향 +"이며 앞(왼쪽) = +90°.
 */
export function CourtBackdrop() {
  return (
    <div className="scene" aria-hidden>
      {/* 원근감 있는 코트 라인 */}
      <svg className="scene-court" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice">
        <g fill="none" strokeLinejoin="round">
          <path d="M 260 60 L 940 60 L 1180 400 L 20 400 Z" />
          <path d="M 330 60 L 160 400 M 870 60 L 1040 400" />
          <path d="M 205 170 L 995 170" />
          <path d="M 600 170 L 600 400" />
          <path className="net" d="M 120 268 L 1080 268" />
        </g>
      </svg>

      {/* 스피드 라인 */}
      <div className="scene-streaks">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

/** 서브하는 선수 실루엣 (토스 → 트로피 자세 → 라켓 드롭 → 임팩트 → 팔로스루) */
export function ServePlayer() {
  return (
    <svg className="serve-player" aria-hidden viewBox="-60 -40 420 560">
      {/* 라켓 궤적 */}
      <path className="swoosh" pathLength={100} d="M 290 330 C 330 40, 120 -70, 20 260" />
      <g className="body">
        {/* 다리 */}
        <path className="limb leg" d="M 205 330 L 228 410 L 246 492" />
        <path className="limb leg" d="M 200 330 L 182 406 L 160 490" />
        {/* 몸통·머리 */}
        <path className="torso" d="M 204 330 L 212 214" />
        <circle className="head" cx="216" cy="172" r="27" />
        {/* 공 던지는 팔 */}
        <g className="arm-toss">
          <path className="limb" d="M 202 214 L 202 318" />
        </g>
        {/* 라켓 팔: 위팔(어깨 회전) > 아래팔+라켓(팔꿈치 회전) */}
        <g className="arm-upper">
          <path className="limb" d="M 218 214 L 218 272" />
          <g className="arm-fore">
            <path className="limb" d="M 218 272 L 218 324" />
            <path className="racket-handle" d="M 218 324 L 218 356" />
            <ellipse className="racket-head" cx="218" cy="392" rx="25" ry="35" />
            <path className="racket-strings" d="M 206 368 L 206 416 M 218 358 L 218 426 M 230 368 L 230 416 M 196 384 L 240 384 M 194 400 L 242 400" />
          </g>
        </g>
      </g>
      {/* 공 (잔상 2개 + 본체) */}
      <circle className="ball ghost g2" cx="166" cy="311" r="11" />
      <circle className="ball ghost g1" cx="166" cy="311" r="11" />
      <circle className="ball" cx="166" cy="311" r="11" />
    </svg>
  )
}
