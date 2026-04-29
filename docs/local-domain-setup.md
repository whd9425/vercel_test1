# 로컬 도메인 설정

4개 사이트(인강 PC/MO, 학원 PC/MO)를 로컬에서 도메인별로 분기시키려면 hosts 파일에 항목을 추가해야 합니다.

## hosts 파일 위치

| OS | 경로 |
| --- | --- |
| Windows | `C:\Windows\System32\drivers\etc\hosts` |
| macOS / Linux | `/etc/hosts` |

> Windows: 메모장을 **관리자 권한**으로 실행한 뒤 위 파일을 열어 편집하세요.

## 추가할 내용

```
127.0.0.1   etest.hackers.local
127.0.0.1   emtest.hackers.local
127.0.0.1   test.hackers.local
127.0.0.1   mtest.hackers.local
```

## 접속 URL

dev 서버를 띄운 후 (`npm run dev`) 다음 주소로 접속:

| 사이트 | URL |
| --- | --- |
| 인강 PC | http://etest.hackers.local:3000 |
| 인강 MO | http://emtest.hackers.local:3000 |
| 학원 PC | http://test.hackers.local:3000 |
| 학원 MO | http://mtest.hackers.local:3000 |

## 라우팅 동작

- `proxy.ts`가 요청의 `host` 헤더를 보고 내부적으로 `/<site-key>/...`로 rewrite합니다.
- 사용자에게 보이는 URL은 그대로(`/`, `/about` 등) 유지됩니다.
- 매칭되지 않는 host로 들어오면 `/unknown-host` 안내 페이지로 rewrite됩니다.

## 빠른 우회 (hosts 파일 수정이 어려울 때)

[src/lib/sites.ts](../src/lib/sites.ts)에서 `localHost` 값을 변경하거나, `NEXT_PUBLIC_DEFAULT_SITE` 환경변수로 dev 모드에서 기본 사이트를 지정할 수 있습니다.

```bash
NEXT_PUBLIC_DEFAULT_SITE=etest npm run dev
```

이 경우 `localhost:3000` 접속 시 인강 PC 사이트가 보입니다.
