/* ==========================================================================
   워킹라이프 — 기본 데이터 & 상수
   ========================================================================== */

// 부위 분류: 상체 / 하체 -> 세부 부위
export const BODY_PARTS = {
  "상체": ["목", "어깨", "팔", "등", "허리"],
  "하체": ["엉덩이", "허벅지", "무릎", "종아리", "발목"],
};

// 관리자 로그인용 이메일 (Supabase Auth 계정 식별자일 뿐, 비밀 값 아님).
// 실제 인증/비밀번호 검증은 서버(Supabase Auth)에서 처리합니다 — js/adminAuth.js 참고.
export const ADMIN_EMAIL = "admin@walklife.local";

// 음성 카운트 기본 설정 (관리자 페이지에서 수정 가능)
//  - intervalSec: 몇 초에 한 번 셀지 (기본 2초)
//  - reps: 총 몇 회 셀지 (기본 12회)
export const DEFAULT_COUNT_SETTINGS = { intervalSec: 2, reps: 12 };

/*
  기본 운동 데이터.
  - 실제 운동 데이터는 이제 Supabase에 저장되며, 이 배열은 (1) 최초 Supabase 시드용 원본,
    (2) 네트워크 연결 실패 시 오프라인 폴백 데이터로만 사용됩니다.
  - youtubeUrl: 관리자가 유튜브 링크로 변경 가능. 비워두면 "영상 준비중" 표시.
  - difficulty: 운동 난이도. 1.0(매우 쉬움) ~ 5.0(매우 어려움), 0.5 단위. 관리자 페이지에서 수정 가능.
*/
export const DEFAULT_EXERCISES = [
  {
    id: "ex-1",
    title: "앞정강근 강화 운동",
    bodyPart: "하체",
    subPart: "발목",
    youtubeUrl: "https://youtu.be/iMgZon0N4kM",
    difficulty: 3,
    description:
      "의자 앉아서 시작하세요.\n\n1. 허리를 곧게 펴고 바르게 앉습니다.\n2. 앉은 상태에서 한쪽 발을 운동할 다리의 발에 올립니다.\n3. 발꿈치가 바닥에 닿은 상태에서 발등 방향으로 발을 굽혀줍니다.\n\n양쪽을 다 진행해주세요.\n1세트 12회를 추천합니다.",
    hashtags: ["걷기", "균형", "다리근력", "낙상예방"],
  },
  {
    id: "ex-2",
    title: "한발 브릿지",
    bodyPart: "하체",
    subPart: "엉덩이",
    youtubeUrl: "https://youtu.be/aiLg2jmDNRk",
    difficulty: 3,
    description:
      "1. 바르게 누운 상태에서 운동하고자 하는 쪽 다리를 굽힙니다.\n\n2. 골반을 천장 방향으로 들어줍니다.\n3. 천천히 원래 자세로 돌아옵니다.\n\n양쪽을 다 진행해주세요.\n12번을 한 세트로 추천합니다. 어지러우면 즉시 멈추고 휴식합니다.",
    hashtags: ["걷기", "허벅지", "다리근력"],
  },
  {
    id: "ex-3",
    title: "레그 익스텐션",
    bodyPart: "하체",
    subPart: "허벅지",
    youtubeUrl: "https://youtu.be/WHFsCmfqptw",
    difficulty: 3,
    description:
      "의자에 앉아서 허리를 바로 세웁니다.\n\n1. 운동하고자 하는 쪽 다리를 폅니다.\n2. 발이 바닥에 소리나지 않게 닿도록 천천히 내려 놓습니다.\n\n양쪽을 다 진행해주세요.\n한세트 12회를 추천합니다.",
    hashtags: ["걷기", "허벅지", "보행"],
  },
  {
    id: "ex-4",
    title: "터미널 니 익스텐션",
    bodyPart: "하체",
    subPart: "무릎",
    youtubeUrl: "https://youtu.be/WHFsCmfqptw",
    difficulty: 3,
    description:
      "벽을 짚고 운동하고자 하는 다리를 한발짝 뒤로 둡니다.\n\n1. 무게중심을 운동하고자 하는 다리에 둔 상태로 천천히 내려갑니다.\n2. 운동하고자 하는 다리를 다시 펴줍니다.\n3. 내려갈 때에는 속도를 조절하는 것에 신경쓰며 진행합니다.\n\n양쪽을 다 진행해주세요.\n한세트 12회를 추천합니다.",
    hashtags: ["걷기", "무릎", "관절", "다리근력", "허벅지", "보행"],
  },

];
