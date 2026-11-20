# Tennis Venue Finder 🎾

서울시 공공서비스예약의 테니스장을 **날짜별·시간대별로 한눈에** 보여주는 웹페이지입니다.

- 평일 / 주말·공휴일 버튼, 또는 오늘부터 14일간의 날짜(일요일·공휴일 빨간색, 토요일 파란색)로 골라 볼 수 있어요.
- 날짜마다 서울 날씨 아이콘, 최저·최고기온, 강수확률(30% 이상)을 보여줘요(약 10일치).
- 같은 테니스장의 여러 코트·평일/주말 서비스는 한 카드로 묶어서 보여줘요.
- 목록은 구 → 테니스장 이름 순으로 정렬되고, 구 이름·검색어·접수중 여부로 필터링해요.
- 카카오 지도에서 위치를 확인하고 카카오맵 길찾기로 이동할 수 있어요(키가 없으면 OpenStreetMap으로 대체).
- "예약사이트 이동"으로 서울시 예약 페이지로 이동해요.
- 반응형(데스크톱: 목록+지도 2단 / 모바일: 탭 전환), 라이트·다크·시스템 테마를 지원해요.

## 데이터

[서울시 공공서비스예약 정보 OpenAPI](https://data.seoul.go.kr) (`ListPublicReservationSport`, 분류 `테니스장`)를 사용해요.

이 API는 **시간대별 잔여 현황을 제공하지 않아요.** 접수 상태(`접수중`/`예약마감` 등), 운영 기간,
운영 시간, 서비스명의 평일/주말 구분만 보여주고, 실제 남은 시간은 예약 페이지에서 확인해야 해요.
그 밖에 공공데이터포털 API를 함께 사용해요(`scripts/fetch-extras.mjs`).

- 한국천문연구원 특일정보: 공휴일 (실패 시 `src/lib/holidays.ts`의 기본 목록 사용)
- 기상청 단기예보(서울 중구 격자) + 중기예보(서울): 날짜별 날씨·기온·강수확률

API가 HTTP만 지원해서 HTTPS 페이지의 브라우저에서 직접 호출할 수 없어요. 그래서
`scripts/fetch-venues.mjs`가 데이터를 받아 `public/data/tennis.json`으로 저장하고, 앱은 그 정적 JSON을 읽어요.

## 시작하기

```bash
npm install
SEOUL_API_KEY=... DATA_GO_KR_KEY=... npm run fetch-data   # 키 없으면 샘플 5건, 날씨·공휴일 생략
npm run dev                                   # http://localhost:5173
npm run build
npm run lint
```

## 배포 (GitHub Pages)

`.github/workflows/deploy.yml`이 main 푸시 때와 **매시간** 데이터를 새로 받아 빌드·배포해요.

1. 저장소 **Settings → Secrets and variables → Actions**에 `SEOUL_API_KEY`, `DATA_GO_KR_KEY`, `KAKAO_MAP_KEY` 추가
   - `KAKAO_MAP_KEY`: [카카오 개발자](https://developers.kakao.com) 앱의 **JavaScript 키**. 앱 설정 → 플랫폼 → Web에 `https://abundancebyj.github.io`(로컬 개발 시 `http://localhost:5173`)를 등록해야 해요.
2. **Settings → Pages → Source**를 `GitHub Actions`로 설정
3. Actions 탭에서 워크플로를 한 번 실행 (또는 main에 푸시)

## 구조

```
scripts/fetch-venues.mjs   OpenAPI → public/data/tennis.json 변환
src/lib/availability.ts    날짜·평일/주말 판정, 정렬
src/lib/holidays.ts        공휴일 목록
src/lib/useTheme.ts        라이트/다크/시스템 테마
src/components/            날짜 선택, 목록, 지도, 테마 토글
```
