# 🎓 코딩 초보자를 위한 완전 친절한 가이드

> 이 가이드는 코딩을 한 번도 해본 적 없는 분도 따라할 수 있도록 작성되었습니다.
> 각 단계마다 스크린샷과 함께 설명하며, 막히는 부분이 있다면 천천히 다시 읽어보세요!

---

## 📋 목차

1. [필요한 프로그램 설치하기](#1-필요한-프로그램-설치하기)
2. [프로젝트 다운로드 받기](#2-프로젝트-다운로드-받기)
3. [첫 데이터 수집하기](#3-첫-데이터-수집하기)
4. [웹사이트 실행하기](#4-웹사이트-실행하기)
5. [GitHub에 올리기](#5-github에-올리기)
6. [인터넷에 공개하기](#6-인터넷에-공개하기)
7. [자동 업데이트 설정하기](#7-자동-업데이트-설정하기)
8. [문제 해결 (FAQ)](#8-문제-해결-faq)

---

## 1. 필요한 프로그램 설치하기

### 1-1. Python 설치 (데이터 수집용)

**Python이란?** 데이터를 수집하는 프로그램을 실행하기 위한 언어입니다.

#### Windows 사용자:

1. 웹브라우저를 열고 주소창에 입력: `https://www.python.org/downloads/`
2. 노란색 "Download Python 3.12.x" 버튼 클릭
3. 다운로드된 파일 실행 (보통 Downloads 폴더에 있음)
4. **중요!** 설치 시작 화면에서 아래 체크박스 꼭 체크:
   ```
   ☑️ Add Python to PATH
   ```
5. "Install Now" 클릭
6. 설치 완료까지 대기 (약 3분)

#### Mac 사용자:

1. 웹브라우저에서 `https://www.python.org/downloads/` 접속
2. "Download Python 3.12.x" 클릭
3. 다운로드된 .pkg 파일 실행
4. 안내에 따라 설치 진행
5. 비밀번호 입력 후 설치 완료

#### 설치 확인:

1. **Windows**: 시작 메뉴 검색에서 "cmd" 입력 → 명령 프롬프트 실행
   **Mac**: Spotlight (Cmd + Space) → "Terminal" 입력 → 터미널 실행

2. 검은 창이 나타나면 다음 입력 후 Enter:
   ```
   python --version
   ```

3. 결과가 이렇게 나오면 성공:
   ```
   Python 3.12.x
   ```

**안 되면?** → [문제 해결 섹션](#python-설치-오류) 참고

---

### 1-2. Node.js 설치 (웹사이트 실행용)

**Node.js란?** 웹사이트를 내 컴퓨터에서 미리 볼 수 있게 해주는 프로그램입니다.

1. 웹브라우저에서 `https://nodejs.org/` 접속
2. 왼쪽 초록색 버튼 "LTS" 버전 다운로드 클릭
3. 다운로드된 설치 파일 실행
4. 전부 "Next" 클릭하며 설치 진행
5. 설치 완료

#### 설치 확인:

명령 프롬프트(Windows) 또는 터미널(Mac)에서:
```
node --version
npm --version
```

둘 다 버전 번호가 나오면 성공!

---

### 1-3. Visual Studio Code 설치 (코드 편집기)

**VS Code란?** 코드를 보기 쉽게 보여주는 에디터입니다. 메모장의 고급 버전이라고 생각하면 됩니다.

1. 웹브라우저에서 `https://code.visualstudio.com/` 접속
2. "Download for Windows" (또는 Mac) 버튼 클릭
3. 설치 파일 실행
4. 전부 "Next" 클릭
5. **중요!** 아래 항목들 체크:
   ```
   ☑️ Add "Open with Code" action to Windows Explorer file context menu
   ☑️ Add "Open with Code" action to Windows Explorer directory context menu
   ```
6. 설치 완료

---

### 1-4. Git 설치 (버전 관리 도구)

**Git이란?** 코드를 GitHub에 업로드하기 위한 도구입니다.

#### Windows:
1. `https://git-scm.com/download/win` 접속
2. 자동으로 다운로드 시작
3. 설치 파일 실행
4. 전부 기본값으로 "Next" 클릭

#### Mac:
터미널에서 다음 입력:
```
git --version
```
Git이 없으면 자동 설치 창이 뜹니다. "설치" 클릭.

#### 설치 확인:
```
git --version
```
버전 번호가 나오면 성공!

---

## 2. 프로젝트 다운로드 받기

### 2-1. 프로젝트 폴더 만들기

1. **Windows**: 
   - 파일 탐색기 열기
   - "내 PC" → "문서" 폴더로 이동
   - 빈 공간에서 마우스 우클릭 → "새로 만들기" → "폴더"
   - 폴더 이름: `ETF-Dashboard`

2. **Mac**:
   - Finder 열기
   - "Documents" 폴더로 이동
   - Cmd + Shift + N (새 폴더)
   - 폴더 이름: `ETF-Dashboard`

---

### 2-2. 프로젝트 파일 복사하기

1. Claude가 제공한 `etf-dashboard-project` 폴더를 다운로드
2. 다운로드한 폴더 안의 모든 파일을 복사
3. 위에서 만든 `ETF-Dashboard` 폴더에 붙여넣기

최종 구조:
```
ETF-Dashboard/
├── scripts/
├── frontend/
├── data/
├── database/
├── backend/
├── .github/
├── README.md
└── QUICKSTART.md
```

---

## 3. 첫 데이터 수집하기

### 3-1. VS Code로 프로젝트 열기

1. VS Code 실행
2. 메뉴에서 "File" → "Open Folder" 클릭
3. 위에서 만든 `ETF-Dashboard` 폴더 선택
4. "폴더 선택" 클릭

왼쪽에 폴더 구조가 보이면 성공!

---

### 3-2. 터미널 열기

VS Code 안에서:
1. 상단 메뉴 "Terminal" → "New Terminal" 클릭
2. 화면 아래쪽에 검은 창이 나타남

**현재 위치 확인:**
터미널에 다음과 같이 표시되어야 합니다:
```
.../ETF-Dashboard>
```

**위치가 다르다면:**
터미널에 입력:
```bash
# Windows
cd C:\Users\YourName\Documents\ETF-Dashboard

# Mac
cd ~/Documents/ETF-Dashboard
```

---

### 3-3. Python 패키지 설치

터미널에 다음 명령어 입력 후 Enter:

**Windows:**
```bash
pip install yfinance pandas
```

**Mac:**
```bash
pip3 install yfinance pandas
```

**설치 중 나타나는 것들:**
```
Collecting yfinance
  Downloading yfinance-0.2.x...
Successfully installed yfinance-0.2.x pandas-2.1.x
```

**5-10분 정도 걸립니다. 빨간 글씨가 조금 나와도 걱정하지 마세요!**

---

### 3-4. 데이터 수집 실행

1. 터미널에 입력:
   ```bash
   cd scripts
   ```

2. 현재 위치 확인 (이렇게 나와야 함):
   ```
   .../ETF-Dashboard/scripts>
   ```

3. 데이터 수집 시작:
   **Windows:**
   ```bash
   python collect_etf_data.py
   ```
   
   **Mac:**
   ```bash
   python3 collect_etf_data.py
   ```

4. **실행 화면:**
   ```
   ============================================================
   ETF 데이터 수집 시작
   시작 시간: 2025-02-16 18:30:00
   ============================================================

   [미국 ETF 수집]

   📊 카테고리: 미국_S&P500
     수집 중: SPY... ✅
     수집 중: VOO... ✅
     수집 중: IVV... ✅
     수집 중: SPLG... ✅

   📊 카테고리: 미국_나스닥
     수집 중: QQQ... ✅
     수집 중: QQQM... ✅
     ...
   ```

5. **완료 화면:**
   ```
   ============================================================
   ✅ 데이터 수집 완료!
   성공: 46개 | 실패: 0개
   저장 위치: ../data/etf_database.json
   완료 시간: 2025-02-16 18:50:00
   ============================================================
   ```

**소요 시간: 약 15-20분**

**❌가 많이 나온다면?** → [문제 해결 섹션](#데이터-수집-오류) 참고

---

### 3-5. 데이터 확인하기

1. VS Code 왼쪽 파일 목록에서 `data` 폴더 클릭
2. `etf_database.json` 파일이 생성되었는지 확인
3. 파일 크기가 0KB보다 크면 성공!
4. 파일을 클릭해서 내용 확인 (JSON 형식으로 데이터 표시됨)

---

## 4. 웹사이트 실행하기

### 4-1. 프론트엔드 폴더로 이동

터미널에 입력:
```bash
cd ..
cd frontend
```

현재 위치 확인:
```
.../ETF-Dashboard/frontend>
```

---

### 4-2. Node.js 패키지 설치

터미널에 입력:
```bash
npm install
```

**설치 화면:**
```
npm WARN deprecated ...
added 324 packages in 45s
```

**소요 시간: 2-5분**

**엄청 많은 폴더가 생성됩니다 (`node_modules`)** - 정상입니다!

---

### 4-3. 개발 서버 실행

터미널에 입력:
```bash
npm run dev
```

**실행 화면:**
```
> etf-dashboard@1.0.0 dev
> next dev

  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 3.2s
```

**이 화면이 나오면 성공!**

---

### 4-4. 웹브라우저로 확인

1. 웹브라우저 (Chrome, Edge 등) 열기
2. 주소창에 입력:
   ```
   http://localhost:3000
   ```
3. Enter

**나타나는 화면:**
- 프리미엄 다크 테마 대시보드
- 46개 ETF 카드
- 수익률 차트

**축하합니다! 🎉 웹사이트가 작동하고 있습니다!**

---

### 4-5. 서버 종료하기

웹사이트 확인이 끝났으면:
1. VS Code 터미널로 돌아가기
2. `Ctrl + C` (Windows) 또는 `Cmd + C` (Mac) 누르기
3. "Terminate batch job (Y/N)?" 나오면 `Y` 입력 후 Enter

서버가 중지됩니다.

---

## 5. GitHub에 올리기

### 5-1. GitHub 계정 만들기

1. 웹브라우저에서 `https://github.com` 접속
2. 오른쪽 위 "Sign up" 클릭
3. 이메일 주소 입력
4. 비밀번호 생성 (안전한 것으로!)
5. 사용자명 입력 (예: `etf-investor-john`)
6. 이메일 인증 완료

---

### 5-2. 새 저장소 만들기

1. GitHub 로그인
2. 오른쪽 위 "+" 버튼 → "New repository" 클릭
3. 정보 입력:
   ```
   Repository name: etf-dashboard
   Description: 46개 주요 ETF 실시간 대시보드
   Public (공개) 선택
   ☑️ Add a README file (체크 해제)
   ```
4. "Create repository" 클릭

---

### 5-3. Git 초기 설정

**처음 Git을 사용한다면 신원 설정 필요:**

VS Code 터미널에서 (위치는 `/ETF-Dashboard`):

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

**예시:**
```bash
git config --global user.name "John Kim"
git config --global user.email "johnkim@gmail.com"
```

---

### 5-4. 프로젝트 업로드

1. 터미널에서 프로젝트 루트로 이동:
   ```bash
   cd ..
   ```
   (현재 위치: `.../ETF-Dashboard>`)

2. Git 초기화:
   ```bash
   git init
   ```
   
   결과: `Initialized empty Git repository`

3. 모든 파일 추가:
   ```bash
   git add .
   ```
   
   (아무 출력 없으면 정상)

4. 첫 커밋:
   ```bash
   git commit -m "Initial commit: ETF Dashboard with 46 ETFs"
   ```
   
   결과: `46 files changed, 5000+ insertions`

5. GitHub 저장소 연결:
   
   **중요: 아래 주소를 본인 것으로 바꾸세요!**
   ```bash
   git remote add origin https://github.com/your-username/etf-dashboard.git
   ```
   
   **예시:**
   ```bash
   git remote add origin https://github.com/johnkim/etf-dashboard.git
   ```

6. 메인 브랜치로 변경:
   ```bash
   git branch -M main
   ```

7. 업로드:
   ```bash
   git push -u origin main
   ```
   
   **GitHub 로그인 창이 나타나면:**
   - 사용자명 입력
   - 비밀번호 입력
   
   **또는 토큰 입력 (권장):**
   - GitHub → Settings → Developer settings → Personal access tokens
   - "Generate new token (classic)" 클릭
   - repo 권한 체크
   - 생성된 토큰을 비밀번호 대신 입력

8. **업로드 완료!**
   ```
   Enumerating objects: 100, done.
   Writing objects: 100% (100/100), 250 KB | 5.00 MB/s, done.
   To https://github.com/johnkim/etf-dashboard.git
    * [new branch]      main -> main
   ```

---

### 5-5. GitHub에서 확인

1. 웹브라우저에서 본인 GitHub 저장소 접속
   ```
   https://github.com/your-username/etf-dashboard
   ```

2. 모든 파일이 보이면 성공!
   - scripts/
   - frontend/
   - data/
   - README.md
   - 등등...

---

## 6. 인터넷에 공개하기 (Vercel 배포)

### 6-1. Vercel 계정 만들기

1. 웹브라우저에서 `https://vercel.com` 접속
2. "Sign Up" 클릭
3. **"Continue with GitHub" 선택 (가장 쉬움)**
4. GitHub 계정으로 로그인
5. Vercel의 GitHub 접근 권한 승인

---

### 6-2. 프로젝트 배포하기

1. Vercel 대시보드에서 "Add New..." → "Project" 클릭
2. "Import Git Repository" 섹션에서 `etf-dashboard` 찾기
3. "Import" 버튼 클릭
4. 설정 화면:
   ```
   Framework Preset: Next.js (자동 감지됨)
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   ```
   
   **중요! Root Directory를 `frontend`로 변경해야 합니다!**

5. "Deploy" 버튼 클릭

6. **배포 진행 중...**
   ```
   Building...
   Deploying...
   ```
   
   **소요 시간: 2-3분**

7. **배포 완료!**
   ```
   🎉 Congratulations!
   Your project is live at:
   https://etf-dashboard-abc123.vercel.app
   ```

---

### 6-3. 웹사이트 확인

1. Vercel이 제공한 URL 클릭
2. 대시보드가 인터넷에 공개됨!
3. 이 주소를 친구들에게 공유 가능

**축하합니다! 🚀 전세계 어디서나 접속 가능한 웹사이트 완성!**

---

## 7. 자동 업데이트 설정하기

### 7-1. GitHub Actions 활성화

1. GitHub 저장소 페이지 접속
2. 상단 탭에서 "Settings" 클릭
3. 왼쪽 메뉴에서 "Actions" → "General" 클릭
4. "Workflow permissions" 섹션에서:
   ```
   ☑️ Read and write permissions
   ```
   선택
5. "Save" 버튼 클릭

---

### 7-2. 자동 업데이트 확인

1. 저장소에서 "Actions" 탭 클릭
2. 왼쪽에 "Update ETF Data" 워크플로우 보임
3. 매일 오전 7시(한국시간) 자동 실행됨

**수동으로 실행해보기:**
1. "Update ETF Data" 클릭
2. 오른쪽 "Run workflow" 버튼 클릭
3. "Run workflow" 확인
4. 실행 중... (약 20분 소요)
5. ✅ 초록색 체크마크 나오면 성공!

---

## 8. 문제 해결 (FAQ)

### Python 설치 오류

**증상:** `python: command not found`

**해결법:**

**Windows:**
1. Python을 다시 설치
2. 설치 시 "Add Python to PATH" 체크 확인
3. 컴퓨터 재시작
4. 다시 확인: `python --version`

**Mac:**
- `python3 --version`으로 시도 (3 붙임)
- 이후 모든 명령어에서 `python` → `python3`로 변경

---

### 데이터 수집 오류

**증상:** 많은 ETF에서 ❌ 표시

**원인:**
1. 인터넷 연결 문제
2. API 제한 (너무 빠른 요청)
3. 티커 심볼 변경/상폐

**해결법:**
1. 인터넷 연결 확인
2. 5분 후 다시 실행
3. 일부 실패는 정상 (40개 이상 성공하면 OK)

**재실행 방법:**
```bash
cd scripts
python collect_etf_data.py
```

---

### npm install 오류

**증상:** `npm: command not found`

**해결법:**
1. Node.js 재설치
2. 터미널/명령 프롬프트 종료 후 재실행
3. 컴퓨터 재시작
4. 다시 확인: `node --version`

---

### localhost:3000 안 열림

**증상:** 브라우저에서 "사이트에 연결할 수 없음"

**해결법:**
1. 터미널에서 서버가 실행 중인지 확인
   - `✓ Ready in ...` 메시지 있어야 함
2. 주소 다시 확인: `http://localhost:3000`
   - `https://` 아님 주의!
3. 포트 충돌 시:
   ```bash
   npm run dev -- -p 3001
   ```
   그리고 `http://localhost:3001` 접속

---

### Git push 오류

**증상:** `Authentication failed`

**해결법:**

**옵션 1: Personal Access Token 사용 (권장)**
1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. "Generate new token (classic)"
4. Note: "ETF Dashboard"
5. Expiration: "No expiration"
6. Scope: ☑️ repo 전체 체크
7. "Generate token" 클릭
8. **토큰 복사 (다시 볼 수 없음!)**
9. git push 시 비밀번호 대신 토큰 입력

**옵션 2: GitHub CLI 사용**
```bash
gh auth login
```
안내에 따라 인증

---

### Vercel 배포 오류

**증상:** "Build failed"

**원인:** Root Directory 설정 안 함

**해결법:**
1. Vercel 프로젝트 → Settings
2. "General" → "Root Directory"
3. `frontend` 입력
4. "Save" 클릭
5. "Deployments" 탭 → "Redeploy" 클릭

---

## 🎉 완료 체크리스트

- [ ] Python, Node.js, VS Code, Git 설치 완료
- [ ] 프로젝트 다운로드 및 폴더 생성
- [ ] 첫 데이터 수집 성공 (46개 ETF)
- [ ] localhost:3000에서 웹사이트 확인
- [ ] GitHub 저장소 생성 및 코드 업로드
- [ ] Vercel 배포 완료 및 공개 URL 확인
- [ ] GitHub Actions 자동 업데이트 설정

---

## 💡 다음 단계

1. **블로그 시작**
   - 네이버 블로그, 티스토리, Medium 중 선택
   - 첫 포스트: "ETF 대시보드 만들기"
   - 대시보드 URL 공유

2. **커뮤니티 홍보**
   - 클리앙 투자 게시판
   - 뽐뿌 재테크 게시판
   - Reddit r/investing

3. **Google Analytics 설치**
   - 방문자 추적 시작
   - 인기 ETF 파악

4. **이메일 뉴스레터**
   - Mailchimp 무료 플랜
   - 구독자 모으기 시작

---

## 📞 도움이 필요하신가요?

막히는 부분이 있다면:
1. 에러 메시지 정확히 복사
2. 어느 단계에서 막혔는지 확인
3. 위 FAQ 섹션 먼저 확인
4. GitHub Issues에 질문 올리기

**화이팅! 당신은 할 수 있습니다! 💪**
