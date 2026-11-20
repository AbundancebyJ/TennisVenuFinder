# Tennis Venue Finder 🎾

주변 테니스장을 찾아보는 웹 앱입니다.

## 기술 스택

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [oxlint](https://oxc.rs/) (린트)

## 시작하기

```bash
npm install
npm run dev       # 개발 서버 (http://localhost:5173)
npm run build     # 프로덕션 빌드
npm run lint      # 린트
```

환경 변수가 필요하면 `.env.example`을 `.env`로 복사해서 사용하세요.

## 폴더 구조

```
src/
  components/   UI 컴포넌트
  data/         샘플 테니스장 데이터
  types/        타입 정의
  App.tsx       검색/필터 화면
```

## 다음 단계

- [ ] 실제 테니스장 데이터 소스 연결 (공공데이터 / 지도 API)
- [ ] 지도 표시 및 내 위치 기준 거리순 정렬
- [ ] 코트 종류·지역 필터
