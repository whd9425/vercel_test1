---
title: 해커스 4도메인 분리 프로젝트 작업 가이드
author: vercel_test1 프로젝트
---

# 해커스 4도메인 분리 프로젝트 작업 가이드

> **대상 독자**: 본 프로젝트에서 페이지/컴포넌트를 개발하는 개발자
> **프로젝트**: Next.js 16 (App Router) 단일 코드베이스로 4개 도메인 운영

---

## 목차

1. 프로젝트 개요
2. 도메인 ↔ 폴더 매핑
3. 폴더 구조 전체 트리
4. 라우팅 동작 원리
5. 사이트별 페이지 개발 가이드
6. 공통 코드 (shared) 사용 가이드
7. 메타태그 / SEO 설정
8. 환경변수 / 사이트 강제 지정
9. 로컬 개발 환경 셋업
10. Vercel 배포 가이드
11. 자주 하는 작업 시나리오 (FAQ)
12. 주의사항 / 알려진 제약

---

## 1. 프로젝트 개요

### 1-1. 무엇을 하는 프로젝트인가
- **단일 Next.js 16 앱**이 **4개의 도메인**을 동시에 서빙합니다.
- 사용자가 접속한 도메인(host 헤더)에 따라 자동으로 해당 사이트의 페이지가 표시됩니다.
- 4개 사이트는 각자 독립된 layout/페이지/스타일을 가질 수 있고, 공통 코드는 별도 폴더에서 공유합니다.

### 1-2. 4개 사이트
| 구분 | 사이트 | Site Key | 운영 도메인 |
| --- | --- | --- | --- |
| 인강 PC | 해커스 인강 (PC) | `etest` | etest.hackers.com |
| 인강 모바일 | 해커스 인강 (모바일) | `emtest` | emtest.hackers.com |
| 학원 PC | 해커스 학원 (PC) | `test` | test.hackers.com |
| 학원 모바일 | 해커스 학원 (모바일) | `mtest` | mtest.hackers.com |

### 1-3. 핵심 동작
```
[사용자 접속]
  ↓
etest.hackers.com/about 으로 요청
  ↓
[proxy.ts] host 헤더 읽음 → "etest" 사이트로 결정
  ↓
내부적으로 /etest/about 으로 rewrite
  ↓
src/app/etest/about/page.tsx 렌더링
  ↓
사용자에게는 URL이 그대로 /about 으로 보임
```

---

## 2. 도메인 ↔ 폴더 매핑

| 도메인 | 작업 폴더 | 비고 |
| --- | --- | --- |
| etest.hackers.com | `src/app/etest/` | 인강 PC 모든 페이지 |
| emtest.hackers.com | `src/app/emtest/` | 인강 모바일 모든 페이지 |
| test.hackers.com | `src/app/test/` | 학원 PC 모든 페이지 |
| mtest.hackers.com | `src/app/mtest/` | 학원 모바일 모든 페이지 |

**핵심 원칙**: 각 도메인 사이트는 자신의 폴더 내에서 완전히 독립적으로 개발 가능합니다.

---

## 3. 폴더 구조 전체 트리

```
vercel_test/
├── docs/                              # 프로젝트 문서
│   ├── local-domain-setup.md          # 로컬 hosts 파일 설정 가이드
│   └── project-guide.md               # (이 문서)
├── public/                            # 정적 파일 (favicon, 이미지 등)
├── src/
│   ├── app/                           # Next.js App Router (라우팅 루트)
│   │   ├── layout.tsx                 # 최상위 layout (HTML wrapper)
│   │   ├── page.tsx                   # 직접 접속 시 안내 페이지
│   │   ├── globals.css                # 전역 CSS
│   │   ├── favicon.ico                # 기본 favicon
│   │   │
│   │   ├── etest/                     # ★ 인강 PC 사이트
│   │   │   ├── layout.tsx             # 인강 PC 전용 layout/메타태그
│   │   │   └── page.tsx               # 인강 PC 메인 페이지
│   │   │
│   │   ├── emtest/                    # ★ 인강 모바일 사이트
│   │   │   ├── layout.tsx             # 인강 MO 전용 layout/메타태그
│   │   │   └── page.tsx
│   │   │
│   │   ├── test/                      # ★ 학원 PC 사이트
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── mtest/                     # ★ 학원 모바일 사이트
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   │
│   │   └── unknown-host/              # 매칭 안 되는 host용 안내 페이지
│   │       └── page.tsx
│   │
│   ├── lib/                           # 비즈니스 로직 / 설정
│   │   └── sites.ts                   # ★ 4개 사이트 메타 + host 매핑 (단일 진실 소스)
│   │
│   ├── shared/                        # ★ 4개 사이트 공통 코드
│   │   └── components/
│   │       └── SiteBadge.tsx          # 공통 컴포넌트 예시
│   │
│   └── proxy.ts                       # ★ host 기반 rewrite 핵심 로직
│
├── next.config.ts                     # Next.js 설정 (allowedDevOrigins 등)
├── package.json
├── tsconfig.json                      # 경로 alias (@/*) 설정
└── .gitignore
```

★ 표시 = 자주 손대는 핵심 파일/폴더

---

## 4. 라우팅 동작 원리

### 4-1. proxy.ts 가 하는 일

`src/proxy.ts`는 모든 요청 앞단에서 실행되는 미들웨어입니다.

**처리 순서:**
1. 요청 path가 이미 `/etest`, `/emtest`, `/test`, `/mtest`, `/unknown-host` 로 시작하면 그대로 통과 (재귀 방지)
2. 쿼리 파라미터 `?site=` 가 있으면 → 그 사이트로 결정 (테스트용 우회)
3. 쿠키 `site_override` 가 있으면 → 그 사이트로 결정 (이전 쿼리 선택 유지)
4. host 헤더 읽어서 [src/lib/sites.ts](../src/lib/sites.ts)의 매핑 테이블에서 사이트 찾기
5. 환경변수 `NEXT_PUBLIC_FORCE_SITE` 가 있으면 항상 우선 (Vercel 다중 프로젝트용)
6. 어느 것도 매칭 안 되면 → `/unknown-host` 페이지로 rewrite
7. 사이트 결정되면 → `/<site>/<원래 path>` 로 내부 rewrite

### 4-2. 우선순위 정리

요청이 들어왔을 때 "어느 사이트의 페이지를 보여줄지"는 다음 6단계 의사결정으로 정해집니다. **위에서부터 순서대로 검사**해서 가장 먼저 매칭되는 것이 최종 사이트로 결정됩니다.

```
[1] ?site= 쿼리 파라미터        ← 가장 강력한 강제
       ↓ (없거나 잘못된 값)
[2] site_override 쿠키          ← 직전 ?site= 선택을 24시간 유지
       ↓ (없거나 잘못된 값)
[3] NEXT_PUBLIC_FORCE_SITE 환경변수   ← Vercel 다중 프로젝트용 잠금
       ↓ (없음)
[4] host 헤더 매칭              ← 운영 환경에서의 정상 흐름
       ↓ (매칭 실패)
[5] NEXT_PUBLIC_DEFAULT_SITE 환경변수 ← 폴백 (host 매칭 실패 시)
       ↓ (없음)
[6] /unknown-host 페이지        ← 마지막 안내
```

#### 단계별 상세 설명

##### [1] `?site=` 쿼리 파라미터 (최우선)

**언제 발동**: URL에 `?site=etest` `?site=mtest` 같은 쿼리 파라미터가 있을 때.

**유효한 값**: `etest`, `emtest`, `test`, `mtest` 중 하나만 인정. 그 외 값(`?site=foo`)은 무효 처리되어 다음 단계로 넘어갑니다.

**부수 효과**: 매칭된 값이 자동으로 **`site_override` 쿠키에 24시간 저장**됩니다. (다음 접속 시 [2]단계가 그 쿠키를 사용)

**사용 시점**:
- 도메인 없이 단일 vercel.app URL 1개로 4개 사이트를 빠르게 비교 테스트
- 운영 host 매칭이 안 되는 환경에서 강제로 특정 사이트 보기

**예시**:
```
https://localhost:3000/?site=etest          → 인강 PC 표시 + 쿠키 저장
https://example.vercel.app/?site=mtest      → 학원 모바일 표시 + 쿠키 저장
https://localhost:3000/?site=foo            → 무효 → [2]단계로 진행
```

**주의**: `?site=`는 매 요청마다 명시해야 동작. 한 번 입력하면 쿠키 덕분에 그 다음부터는 자동 유지.

---

##### [2] `site_override` 쿠키

**언제 발동**: [1]에서 쿠키가 한 번이라도 저장된 후, `?site=` 없이 접속할 때.

**값**: `etest` / `emtest` / `test` / `mtest` 중 하나.

**유효 기간**: 24시간 (`maxAge: 60 * 60 * 24`).

**무효 처리**: 쿠키 값이 4개 site key 중 하나가 아니면 무시하고 다음 단계로.

**사용 시점**: 사용자가 한 번 `?site=`로 사이트 선택 후 → 같은 브라우저에서 페이지를 돌아다닐 때 자동 유지.

**리셋 방법**:
- 브라우저 개발자도구 → Application → Cookies → `site_override` 삭제
- 또는 시크릿 창 사용
- 또는 다른 `?site=` 쿼리로 덮어쓰기

**예시 흐름**:
```
1. https://localhost:3000/?site=mtest
   → 학원 모바일 표시, site_override=mtest 쿠키 저장

2. https://localhost:3000/notice
   → 쿠키 읽음 → 학원 모바일의 /notice 표시

3. (24시간 후) https://localhost:3000/notice
   → 쿠키 만료 → 다음 단계로 진행
```

---

##### [3] `NEXT_PUBLIC_FORCE_SITE` 환경변수

**언제 발동**: 서버 빌드/런타임에 환경변수 `NEXT_PUBLIC_FORCE_SITE`가 설정돼있을 때.

**값**: `etest` / `emtest` / `test` / `mtest` 중 하나.

**특징**: **이 변수가 있으면 host 헤더가 무엇이든 무시**하고 강제로 그 사이트로 동작합니다. 즉 위 [4] host 매칭보다 먼저 평가됨.

**사용 시점**: **Vercel에 4개 프로젝트를 만들고 같은 GitHub 저장소를 import**해서 각 프로젝트마다 다른 값을 설정 → 도메인 없이 4개 임시 URL을 받는 시나리오.

**설정 방법** (Vercel):
1. Vercel 프로젝트 → Settings → Environment Variables
2. Key: `NEXT_PUBLIC_FORCE_SITE`, Value: `etest` (사이트별로 다르게)
3. Production / Preview / Development 모두 체크
4. Sensitive 체크 해제
5. Redeploy 필수

**주의**: 운영 환경(진짜 hackers.com 도메인 4개를 1개 프로젝트에 연결)에서는 **이 변수를 절대 설정하지 말 것**. 모든 도메인이 같은 사이트로 잠겨버립니다.

---

##### [4] host 헤더 매칭 (운영 환경 정상 흐름)

**언제 발동**: 위 [1]~[3]이 모두 발동 안 된 일반 요청. 운영 환경에서는 이 단계가 메인입니다.

**동작**: 요청의 `Host:` 헤더 값을 읽어서 [src/lib/sites.ts](../src/lib/sites.ts)의 `HOST_TO_SITE` 매핑 테이블에서 찾음.

**매칭되는 호스트 목록** (각 사이트마다 3종류):
| 종류 | 필드 | 예시 (etest) | 사용 환경 |
| --- | --- | --- | --- |
| 운영 | `prodHost` | `etest.hackers.com` | 실제 서비스 도메인 |
| 로컬 | `localHost` | `etest.hackers.local` | hosts 파일로 매핑한 개발 환경 |
| Vercel | `vercelHost` | `etest-vercel-test1.vercel.app` | Vercel 임시 URL |

**전처리**: host 값은 **소문자 변환 + 포트 제거** 후 비교됩니다 (`Etest.Hackers.Com:3000` → `etest.hackers.com`).

**예시**:
```
Host: etest.hackers.com           → etest 사이트
Host: emtest.hackers.local:3000   → emtest 사이트
Host: TEST.HACKERS.COM            → test 사이트 (대소문자 무시)
Host: random.example.com          → 매칭 실패 → [5]단계로
```

**새 호스트 추가 방법**: [src/lib/sites.ts](../src/lib/sites.ts)의 해당 사이트 객체에 필드 추가/수정.

---

##### [5] `NEXT_PUBLIC_DEFAULT_SITE` 환경변수 (폴백)

**언제 발동**: [4]에서 host 매칭에 실패했을 때만.

**값**: `etest` / `emtest` / `test` / `mtest` 중 하나.

**사용 시점**:
- **로컬 개발 시 hosts 파일 못 건드릴 때** → `localhost:3000`으로 접속해도 특정 사이트로 폴백
- **Vercel 임시 URL이 sites.ts에 등록되지 않은 경우 폴백**

**설정 방법** (로컬):
```bash
NEXT_PUBLIC_DEFAULT_SITE=etest npm run dev
```
→ `localhost:3000` 접속 시 인강 PC가 보임 (host 매칭 실패 → 이 변수가 폴백)

**[3] FORCE와의 차이**:
| 변수 | 동작 |
| --- | --- |
| `NEXT_PUBLIC_FORCE_SITE` | host 무시하고 **무조건** 그 사이트 |
| `NEXT_PUBLIC_DEFAULT_SITE` | host 매칭 시도 후 **실패한 경우만** 폴백 |

운영에서 진짜 도메인 4개 연결 시에는 둘 다 설정하지 않는 게 일반적입니다.

---

##### [6] `/unknown-host` 페이지 (마지막 안내)

**언제 발동**: [1]~[5]이 모두 실패한 경우. 즉 — 쿼리/쿠키/FORCE 없음 + host 매칭 실패 + DEFAULT 환경변수도 없음.

**동작**: 내부적으로 `/unknown-host`로 rewrite. 사용자에게는 [src/app/unknown-host/page.tsx](../src/app/unknown-host/page.tsx)의 안내 페이지가 표시됩니다.

**무엇을 보여주는가**:
- 현재 접속한 host 값
- 등록된 4개 사이트의 prod/local/vercel 호스트 목록 — 사용자가 어떤 URL로 접속해야 하는지 안내

**사용 시점**: 잘못된 도메인으로 접속한 사용자에게 친절한 에러 페이지 역할.

**커스터마이즈**: [src/app/unknown-host/page.tsx](../src/app/unknown-host/page.tsx) 직접 수정.

---

#### 시나리오별 어떤 단계가 발동되는지

| 상황 | 발동 단계 | 결과 |
| --- | --- | --- |
| 운영: `etest.hackers.com/`으로 접속 | [4] host 매칭 | 인강 PC |
| 로컬 hosts 설정 후 `etest.hackers.local:3000/` | [4] host 매칭 | 인강 PC |
| 로컬 + hosts 미설정 + DEFAULT_SITE=etest | [5] DEFAULT 폴백 | 인강 PC |
| 로컬 + 아무 설정 X + `localhost:3000/` | [6] unknown-host | 안내 페이지 |
| `localhost:3000/?site=mtest` | [1] 쿼리 | 학원 모바일 + 쿠키 저장 |
| 위 직후 `localhost:3000/about` | [2] 쿠키 | 학원 모바일의 about |
| Vercel 4개 프로젝트, FORCE_SITE=etest 설정 | [3] FORCE | 인강 PC (host 무시) |
| 운영 + 사용자 실수로 잘못된 도메인 접속 | [6] unknown-host | 안내 페이지 |

---

#### 디버깅 팁

**현재 어느 단계가 발동됐는지 확인하려면**:

1. **응답 헤더 `x-site` 확인**: proxy.ts가 사이트 결정 시 응답 헤더에 site key를 박아둠. 브라우저 개발자도구 → Network → 요청 클릭 → Response Headers → `x-site` 값.
   ```
   x-site: etest    ← 인강 PC로 결정됨
   ```

2. **`x-site` 헤더가 없음** → [6] unknown-host로 빠진 것.

3. **쿠키 확인**: 개발자도구 → Application → Cookies → `site_override`. 있으면 [2]단계가 작동 중.

4. **환경변수 확인** (Vercel): 프로젝트 Settings → Environment Variables.

### 4-3. URL 변화 예시
| 사용자가 접속한 URL | 내부적으로 rewrite되는 경로 | 렌더링되는 파일 |
| --- | --- | --- |
| `etest.hackers.com/` | `/etest` | `src/app/etest/page.tsx` |
| `etest.hackers.com/about` | `/etest/about` | `src/app/etest/about/page.tsx` |
| `mtest.hackers.com/courses/123` | `/mtest/courses/123` | `src/app/mtest/courses/[id]/page.tsx` |

**중요**: 사용자 브라우저 주소창 URL은 변하지 않습니다. 내부 rewrite는 사용자에게 보이지 않아요.

---

## 5. 사이트별 페이지 개발 가이드

### 5-1. 새 페이지 추가하기

예: 인강 PC 사이트(etest.hackers.com)에 `/notice` 공지사항 페이지 추가하고 싶다.

**파일 생성 위치**: `src/app/etest/notice/page.tsx`

```tsx
// src/app/etest/notice/page.tsx
export default function NoticePage() {
  return (
    <section>
      <h2>인강 PC 공지사항</h2>
      <p>여기는 etest.hackers.com/notice 입니다.</p>
    </section>
  );
}
```

이렇게만 하면:
- `etest.hackers.com/notice` 접속 시 이 페이지가 표시됨
- 다른 도메인(`mtest.hackers.com/notice` 등)에는 영향 없음

### 5-2. 같은 URL인데 도메인별로 다른 화면 만들기

예: `/contact` 페이지를 4개 사이트 모두에 만들고 싶다. 단, 디자인은 다 다름.

**각 사이트 폴더에 따로 작성:**
```
src/app/etest/contact/page.tsx     ← 인강 PC용
src/app/emtest/contact/page.tsx    ← 인강 MO용
src/app/test/contact/page.tsx      ← 학원 PC용
src/app/mtest/contact/page.tsx     ← 학원 MO용
```

같은 `/contact` URL이지만 host에 따라 다른 파일이 렌더링됩니다.

### 5-3. 동적 라우팅 (상품 상세 등)

예: 학원 PC 사이트에 강의 상세 페이지 `/courses/123` 추가.

**파일**: `src/app/test/courses/[id]/page.tsx`

```tsx
// src/app/test/courses/[id]/page.tsx
export default async function CourseDetail({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>강의 ID: {id}</div>;
}
```

### 5-4. 사이트 전용 layout / 디자인

각 사이트 폴더의 `layout.tsx`는 그 사이트의 모든 하위 페이지에 적용됩니다.

```tsx
// src/app/etest/layout.tsx
export default function EtestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-white">
      <header className="px-8 py-4">인강 PC 헤더</header>
      <main>{children}</main>
      <footer>인강 PC 푸터</footer>
    </div>
  );
}
```

이 layout은 `src/app/etest/` 하위 모든 페이지에 자동 적용됩니다.

### 5-5. 사이트 내부 페이지 이동
같은 사이트 안에서는 `<Link>` 정상 사용 가능:

```tsx
import Link from "next/link";

// etest 사이트 내부에서
<Link href="/notice">공지사항</Link>     // → etest.hackers.com/notice
<Link href="/courses/123">강의 상세</Link>
```

### 5-6. 다른 사이트로 이동 (도메인 간 이동)
**`<Link>` 사용 금지!** 다른 도메인은 client-side 네비게이션이 안 됩니다.

```tsx
// ❌ 잘못된 예 — etest에서 mtest로 이동 시도
<Link href="https://mtest.hackers.com/something">학원 모바일</Link>

// ✅ 올바른 예 — 일반 a 태그 사용 (full page reload)
<a href="https://mtest.hackers.com/something">학원 모바일</a>
```

---

## 6. 공통 코드 (shared) 사용 가이드

### 6-1. 위치
**모든 공통 코드는 `src/shared/`에 둡니다.**

### 6-2. 권장 폴더 구조
```
src/shared/
├── components/   # 공통 UI 컴포넌트 (Button, Modal, Input 등)
├── lib/          # 유틸 함수 (date format, validators 등)
├── api/          # API 클라이언트, fetcher
├── hooks/        # 공통 React 훅 (useDebounce, useAuth 등)
└── types/        # 공통 TypeScript 타입 정의
```

> 처음에 폴더를 다 만들 필요는 없습니다. 필요할 때 추가하세요.

### 6-3. 사용 방법
어느 사이트에서든 동일하게 import:

```tsx
// src/app/etest/page.tsx
import { SiteBadge } from "@/shared/components/SiteBadge";
import { fetchUser } from "@/shared/api/user";
import { formatDate } from "@/shared/lib/date";
import { useAuth } from "@/shared/hooks/useAuth";

export default function EtestPage() {
  return <SiteBadge siteKey="etest" />;
}
```

### 6-4. 새 공통 컴포넌트 만들기 — 예시

예: 4개 사이트가 모두 사용할 `Button` 컴포넌트.

**파일**: `src/shared/components/Button.tsx`
```tsx
type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

export function Button({ children, onClick, variant = "primary" }: Props) {
  const className = variant === "primary"
    ? "bg-blue-600 text-white px-4 py-2 rounded"
    : "bg-gray-200 text-gray-900 px-4 py-2 rounded";

  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
}
```

**사용**:
```tsx
// 어느 사이트에서든
import { Button } from "@/shared/components/Button";

<Button variant="primary" onClick={() => alert("hi")}>저장</Button>
```

### 6-5. ⚠️ 주의 — `src/app/` 직속에 `shared/` 두지 말 것

```
❌ src/app/shared/         ← 절대 안 됨! Next.js가 /shared URL을 만들어버림
✅ src/shared/             ← 이렇게 src 직속으로
```

`app/` 폴더 안에 들어간 모든 폴더는 라우트로 인식됩니다.

### 6-6. 사이트별로 분기되는 공통 컴포넌트
공통 컴포넌트인데 사이트마다 살짝 다르게 동작해야 할 때:

```tsx
// src/shared/components/Header.tsx
import type { SiteKey } from "@/lib/sites";

type Props = { siteKey: SiteKey };

export function Header({ siteKey }: Props) {
  const isMobile = siteKey === "emtest" || siteKey === "mtest";
  const isAcademy = siteKey === "test" || siteKey === "mtest";

  return (
    <header className={isMobile ? "p-2" : "p-6"}>
      {isAcademy ? "학원" : "인강"}
    </header>
  );
}
```

각 사이트 layout에서 자신의 siteKey를 넘기면 됩니다.

---

## 7. 메타태그 / SEO 설정

### 7-1. 사이트별 기본 메타태그

각 사이트 layout에서 `metadata` export로 정의합니다.

```tsx
// src/app/etest/layout.tsx
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "해커스 인강",
    template: "%s | 해커스 인강",   // 하위 페이지에서 자동 합쳐짐
  },
  description: "해커스 인강 PC 사이트",
  keywords: ["인강", "해커스", "토익"],
  openGraph: {
    title: "해커스 인강",
    description: "...",
    url: "https://etest.hackers.com",
    siteName: "해커스 인강",
    images: ["/og-etest.png"],
    locale: "ko_KR",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "...", images: ["..."] },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon-etest.ico" },
  alternates: {
    canonical: "https://etest.hackers.com",
    languages: { "ko-KR": "https://etest.hackers.com" },
  },
};

export const viewport: Viewport = {
  themeColor: "#0066ff",
  width: "device-width",
  initialScale: 1,
};

export default function EtestLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

### 7-2. 페이지별 메타태그 (정적)

```tsx
// src/app/etest/notice/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "공지사항",   // → "공지사항 | 해커스 인강" (template 적용됨)
  description: "해커스 인강의 공지사항입니다.",
};

export default function NoticePage() {
  return <div>...</div>;
}
```

### 7-3. 페이지별 메타태그 (동적 — 상세 페이지 등)

```tsx
// src/app/etest/courses/[id]/page.tsx
import type { Metadata } from "next";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params;
  const course = await fetchCourse(id);
  return {
    title: course.name,
    description: course.summary,
    openGraph: { images: [course.thumbnailUrl] },
  };
}

export default function CourseDetail() { /* ... */ }
```

### 7-4. 메타태그 상속 규칙
```
src/app/layout.tsx (root)
  ↓ 머지
src/app/etest/layout.tsx (사이트별)
  ↓ 머지
src/app/etest/courses/[id]/page.tsx (페이지별)
  ↓
최종 메타태그
```

- 같은 키를 하위에서 다시 정의하면 **덮어쓰기**
- `title.template`을 layout에 두면 하위 페이지의 title이 자동으로 그 패턴 적용

### 7-5. 사이트별 favicon / OG 이미지 분리

`public/` 폴더에 이미지 파일들 둠:
```
public/
├── favicon-etest.ico
├── favicon-emtest.ico
├── favicon-test.ico
├── favicon-mtest.ico
├── og-etest.png
├── og-emtest.png
├── og-test.png
└── og-mtest.png
```

각 사이트 layout에서 위처럼 경로 명시:
```tsx
icons: { icon: "/favicon-etest.ico" },
openGraph: { images: ["/og-etest.png"] },
```

---

## 8. 환경변수 / 사이트 강제 지정

### 8-1. `NEXT_PUBLIC_FORCE_SITE` (사이트 강제)
설정하면 host 헤더 무시하고 항상 그 사이트로 동작합니다.

| 값 | 동작 |
| --- | --- |
| `etest` | 모든 요청을 인강 PC로 |
| `emtest` | 모든 요청을 인강 MO로 |
| `test` | 모든 요청을 학원 PC로 |
| `mtest` | 모든 요청을 학원 MO로 |

**용도**: Vercel에 4개 프로젝트 만들고 각각 다른 값으로 설정해서 사이트별 임시 URL 받기.

### 8-2. `NEXT_PUBLIC_DEFAULT_SITE` (기본 사이트 - 폴백)
host가 매칭 안 될 때 → unknown-host로 보내는 대신 → 이 사이트로 폴백.

```bash
NEXT_PUBLIC_DEFAULT_SITE=etest npm run dev
```

이러면 `localhost:3000` 접속 시 인강 PC가 보임 (hosts 파일 안 건드려도 됨).

### 8-3. 우선순위 다시
```
?site= 쿼리         (가장 우선)
site_override 쿠키
NEXT_PUBLIC_FORCE_SITE 환경변수
host 헤더 매칭
NEXT_PUBLIC_DEFAULT_SITE 환경변수 (host 매칭 실패 시 폴백)
unknown-host                     (마지막)
```

---

## 9. 로컬 개발 환경 셋업

### 9-1. 의존성 설치 & 실행
```bash
npm install
npm run dev
```
http://localhost:3000

### 9-2. 4개 도메인 시뮬레이션 — hosts 파일 설정

**Windows**: `C:\Windows\System32\drivers\etc\hosts` (관리자 권한 메모장으로 열기)
**macOS/Linux**: `/etc/hosts`

다음 4줄 추가:
```
127.0.0.1   etest.hackers.local
127.0.0.1   emtest.hackers.local
127.0.0.1   test.hackers.local
127.0.0.1   mtest.hackers.local
```

### 9-3. 로컬 접속 URL
| 사이트 | URL |
| --- | --- |
| 인강 PC | http://etest.hackers.local:3000 |
| 인강 MO | http://emtest.hackers.local:3000 |
| 학원 PC | http://test.hackers.local:3000 |
| 학원 MO | http://mtest.hackers.local:3000 |

### 9-4. hosts 파일 못 건드릴 때 — 쿼리로 우회

```
http://localhost:3000/?site=etest    ← 인강 PC로 강제
http://localhost:3000/?site=emtest   ← 인강 MO로 강제
http://localhost:3000/?site=test     ← 학원 PC로 강제
http://localhost:3000/?site=mtest    ← 학원 MO로 강제
```

한 번 접속하면 쿠키(`site_override`)에 24시간 저장됩니다. 다른 사이트 보려면 다시 `?site=` 로 접속.

쿠키 초기화: 브라우저 개발자도구 → Application → Cookies → `site_override` 삭제. 또는 시크릿 창.

### 9-5. 빌드 & 운영 모드 실행
```bash
npm run build
npm run start
```

---

## 10. Vercel 배포 가이드

### 10-1. 운영 시나리오 (실제 hackers.com 도메인 사용)

**1개 Vercel 프로젝트 + 4개 도메인 연결**

1. GitHub 저장소를 Vercel에 import
2. Settings → Domains 메뉴
3. 4개 도메인 각각 Add:
   ```
   etest.hackers.com
   emtest.hackers.com
   test.hackers.com
   mtest.hackers.com
   ```
4. 각 도메인의 DNS(가비아/후이즈 등)에서 Vercel이 알려주는 CNAME 레코드 추가
5. SSL은 자동 발급
6. main 브랜치 push 시 4개 도메인 동시 배포

이 시나리오에서는 환경변수 `NEXT_PUBLIC_FORCE_SITE` 설정하지 말 것 (host 매칭이 자동 동작).

### 10-2. 임시 시나리오 (도메인 없이 테스트)

**4개 Vercel 프로젝트 + 각자 다른 환경변수**

같은 GitHub 저장소를 4번 import해서 프로젝트 4개 만들고, 각각에 다른 `NEXT_PUBLIC_FORCE_SITE` 값 설정.

| 프로젝트명(예시) | NEXT_PUBLIC_FORCE_SITE | 자동 발급 URL(예시) |
| --- | --- | --- |
| etest-hackers | `etest` | etest-hackers.vercel.app |
| emtest-hackers | `emtest` | emtest-hackers.vercel.app |
| test-hackers | `test` | test-hackers.vercel.app |
| mtest-hackers | `mtest` | mtest-hackers.vercel.app |

**환경변수 설정 시 주의**:
- Vercel Settings → Environment Variables 에서 추가
- **Production / Preview / Development 모두 체크**
- **Sensitive 체크 해제** (`NEXT_PUBLIC_*`은 클라이언트에 노출되는 값)
- 환경변수 변경 후에는 **반드시 Redeploy** (Deployments 탭 → 최신 ⋯ → Redeploy)

### 10-3. 배포 후 확인할 URL
**Production URL** 만 사용하세요. 해시 포함된 URL은 일회성 preview URL이라 만료됩니다.

| URL 형태 | 종류 | 사용 가능 |
| --- | --- | --- |
| `<project>.vercel.app` | Production alias | ✅ 항상 |
| `<project>-<team>.vercel.app` | Production alias | ✅ 항상 |
| `<project>-**hash**-<team>.vercel.app` | 특정 배포 URL | ❌ 만료됨 |

Production URL 확인: Vercel Project → Overview → Production Deployment 카드 → **Domains** 항목

---

## 11. 자주 하는 작업 시나리오 (FAQ)

### Q1. 인강 PC에 회원가입 페이지 추가하고 싶어요.
**파일 생성**: `src/app/etest/signup/page.tsx`
```tsx
export default function SignupPage() {
  return <h1>회원가입</h1>;
}
```
접속: `etest.hackers.com/signup`

---

### Q2. 4개 사이트 모두에 똑같이 로그인 페이지를 만들고 싶어요.
**4개 파일 만들기**:
```
src/app/etest/login/page.tsx
src/app/emtest/login/page.tsx
src/app/test/login/page.tsx
src/app/mtest/login/page.tsx
```

각 파일에서 공통 컴포넌트 import:
```tsx
import { LoginForm } from "@/shared/components/LoginForm";

export default function LoginPage() {
  return <LoginForm />;
}
```

PC/MO에 따라 디자인이 달라야 하면 layout만 다르게 두고 LoginForm은 같은 거 사용.

---

### Q3. 모든 사이트에서 사용할 API 호출 함수를 만들고 싶어요.
**파일**: `src/shared/api/user.ts`
```ts
export async function fetchUser(id: string) {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}
```

**사용**:
```tsx
import { fetchUser } from "@/shared/api/user";

const user = await fetchUser("123");
```

---

### Q4. 인강 PC만 다크모드 토글이 필요해요.
인강 PC만의 컴포넌트면 `src/app/etest/_components/DarkModeToggle.tsx`에 두기. (`_` 접두사 폴더는 라우팅에서 제외됨)

```tsx
// src/app/etest/layout.tsx
import { DarkModeToggle } from "./_components/DarkModeToggle";

export default function EtestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DarkModeToggle />
      {children}
    </>
  );
}
```

---

### Q5. 페이지에서 현재 사이트가 무엇인지 알고 싶어요.
파일 경로로 자명합니다. `src/app/etest/notice/page.tsx`에서 작성 중이라면 항상 etest 사이트입니다.

만약 공통 컴포넌트에서 알아야 한다면 props로 넘기세요:
```tsx
// src/app/etest/page.tsx
<SiteBadge siteKey="etest" />
```

또는 헤더 `x-site`를 읽기 (proxy.ts가 세팅함):
```tsx
import { headers } from "next/headers";

export default async function Page() {
  const h = await headers();
  const site = h.get("x-site");
  return <div>현재 사이트: {site}</div>;
}
```

---

### Q6. 사이트별로 다른 색상 테마를 적용하고 싶어요.
각 사이트 layout에서 다른 className 적용:
```tsx
// src/app/etest/layout.tsx
<div className="theme-ingang-pc">{children}</div>

// src/app/mtest/layout.tsx
<div className="theme-academy-mo">{children}</div>
```

`globals.css`에 테마 정의:
```css
.theme-ingang-pc { --primary: #0066ff; }
.theme-academy-mo { --primary: #ff6600; }
```

---

### Q7. 새 사이트(예: 인강 태블릿)를 추가하고 싶어요.

**5단계**:
1. [src/lib/sites.ts](../src/lib/sites.ts)의 `SiteKey` 타입에 새 키 추가 (예: `etabtest`)
2. `SITES` 객체에 새 사이트 메타 추가 (label, prodHost 등)
3. `src/app/etabtest/layout.tsx`, `src/app/etabtest/page.tsx` 생성
4. proxy.ts나 다른 코드는 자동으로 신규 사이트 인식 (sites.ts가 단일 진실 소스)
5. Vercel Domains에 새 도메인(`etabtest.hackers.com`) 추가 + DNS 설정

---

### Q8. 페이지에서 "이 페이지가 인강이냐 학원이냐" 분기하고 싶어요.
[src/lib/sites.ts](../src/lib/sites.ts)의 `category` 필드 활용:
```ts
import { SITES, type SiteKey } from "@/lib/sites";

const isAcademy = (key: SiteKey) => SITES[key].category === "academy";
const isMobile  = (key: SiteKey) => SITES[key].device === "mo";
```

---

## 12. 주의사항 / 알려진 제약

### 12-1. 사이트 간 이동은 항상 `<a>` 태그
```tsx
❌ <Link href="https://mtest.hackers.com/...">
✅ <a href="https://mtest.hackers.com/...">
```
다른 도메인이라 Next의 client-side 네비게이션이 안 됨. full page reload만 가능.

### 12-2. `src/app/` 직속에 `shared` 같은 폴더 두면 안 됨
```
❌ src/app/shared/        ← Next.js가 /shared URL을 만들어버림
✅ src/shared/            ← src 직속이 정답
```

### 12-3. 환경변수 `NEXT_PUBLIC_*`는 클라이언트에도 노출됨
- 비밀값(API key, DB password)은 절대 `NEXT_PUBLIC_` 접두사 쓰지 말 것
- 비밀값은 일반 환경변수(`process.env.SOMETHING`)로 두면 서버에서만 접근 가능

### 12-4. 1개 Next 앱이라 4개 사이트가 함께 배포됨
- 인강 팀이 학원 팀 모르게 배포 못 함
- 한 사이트 빌드 실패 = 4개 다 영향
- main 브랜치 push = 4개 도메인 동시 배포

### 12-5. 같은 의존성 버전 강제
- React, Next.js 등 버전을 한 사이트만 다르게 못 씀

### 12-6. CDN 캐시 — 운영 시 host별 캐시 분리 필요
- 동일 URL `/about` 인데 4개 도메인 모두 다른 콘텐츠
- Vercel은 자동으로 host별 캐시 분리해줌
- 다른 CDN 사용 시 `Vary: Host` 헤더 명시 필요

### 12-7. `NEXT_PUBLIC_*` 환경변수의 "Sensitive" 플래그
- Vercel에서 환경변수 만들 때 "Sensitive" 체크하면 빌드/런타임에 값을 못 읽을 수 있음
- `NEXT_PUBLIC_*` 변수는 Sensitive 체크 해제할 것

### 12-8. proxy.ts 위치
- `src/proxy.ts` (즉, `src/app/`과 같은 레벨)
- `src/app/proxy.ts`로 옮기면 동작 안 함

### 12-9. 환경변수 변경 후 재배포 필수
- Vercel에서 환경변수 변경 후 → Deployments 탭 → 최신 ⋯ → Redeploy
- 자동 재배포되지 않음

### 12-10. Public 폴더는 4개 사이트 공유
- `public/logo.png`은 4개 도메인 모두 같은 파일
- 사이트별 다른 이미지 쓰려면 파일명 분리 (`logo-etest.png`, `logo-mtest.png` 등)

---

## 부록 A. 핵심 파일 한 줄 요약

| 파일 | 역할 |
| --- | --- |
| [src/lib/sites.ts](../src/lib/sites.ts) | 4개 사이트 정의 (단일 진실 소스). 새 사이트 추가 시 가장 먼저 수정 |
| [src/proxy.ts](../src/proxy.ts) | host 기반 rewrite 로직 |
| [src/app/layout.tsx](../src/app/layout.tsx) | 4개 사이트 공통 HTML wrapper |
| [src/app/page.tsx](../src/app/page.tsx) | host 매칭 안 된 직접 접속 안내 |
| [src/app/{etest,emtest,test,mtest}/](../src/app/) | 각 사이트 페이지 작업 폴더 |
| [src/app/unknown-host/page.tsx](../src/app/unknown-host/page.tsx) | 알 수 없는 host 안내 페이지 |
| [src/shared/](../src/shared/) | 4개 사이트 공통 코드 |
| [next.config.ts](../next.config.ts) | Next.js 설정 (allowedDevOrigins 등) |
| [docs/local-domain-setup.md](./local-domain-setup.md) | 로컬 hosts 파일 설정 |

---

## 부록 B. 명령어 치트시트

```bash
# 의존성 설치
npm install

# 개발 서버 (localhost:3000)
npm run dev

# 기본 사이트 강제하면서 dev (hosts 파일 안 건드리고 싶을 때)
NEXT_PUBLIC_DEFAULT_SITE=etest npm run dev

# 프로덕션 빌드
npm run build

# 빌드된 앱 실행
npm run start

# 린트
npm run lint
```

---

## 부록 C. 트러블슈팅

### 로컬에서 도메인 접속 시 화면 안 나옴
- hosts 파일 저장됐는지 확인
- DNS 캐시: `ipconfig /flushdns` (Windows) / `sudo dscacheutil -flushcache` (macOS)
- 브라우저 캐시: 시크릿 창 또는 Ctrl+Shift+R

### Vercel 배포 후 404
- Production URL 사용했는지 (해시 포함된 URL은 만료됨)
- 환경변수 변경 후 Redeploy 했는지
- "Use existing Build Cache" 체크 해제하고 재배포 시도

### "domain is invalid" 에러 (Vercel 도메인 등록 시)
- Vercel은 임의의 `*.vercel.app` 서브도메인 등록 막아둠
- 본인 소유 실제 도메인이거나, 4개 별도 프로젝트 방식 사용

### proxy.ts deprecation 경고
- 현재 `proxy.ts`로 정상. 만약 `middleware.ts`로 되어있다면 `proxy.ts`로 이름 변경

---

**문서 끝**
