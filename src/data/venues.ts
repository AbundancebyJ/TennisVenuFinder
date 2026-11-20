import type { Venue } from '../types/venue'

// 샘플 데이터 — 실제 데이터 소스(API 등)로 교체 예정
export const venues: Venue[] = [
  {
    id: 'olympic-park',
    name: '올림픽공원 테니스장',
    address: '서울 송파구 올림픽로 424',
    region: '서울',
    surface: 'hard',
    courts: 16,
    indoor: false,
    lat: 37.5206,
    lng: 127.1214,
  },
  {
    id: 'jangchung',
    name: '장충 테니스장',
    address: '서울 중구 동호로 241',
    region: '서울',
    surface: 'hard',
    courts: 8,
    indoor: false,
    lat: 37.5587,
    lng: 127.0065,
  },
  {
    id: 'bundang-indoor',
    name: '분당 실내 테니스장 (예시)',
    address: '경기 성남시 분당구',
    region: '경기',
    surface: 'carpet',
    courts: 4,
    indoor: true,
    lat: 37.3826,
    lng: 127.1189,
  },
]
