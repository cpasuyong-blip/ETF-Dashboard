# 🔧 상세 문제 해결 가이드

> 실행 중 발생할 수 있는 모든 오류와 해결 방법을 정리했습니다.

---

## 📋 목차

1. [Python 관련 오류](#python-관련-오류)
2. [Node.js 관련 오류](#nodejs-관련-오류)
3. [Git 관련 오류](#git-관련-오류)
4. [데이터 수집 오류](#데이터-수집-오류)
5. [프론트엔드 실행 오류](#프론트엔드-실행-오류)
6. [배포 관련 오류](#배포-관련-오류)

---

## Python 관련 오류

### 오류 1: `python: command not found`

**화면:**
```
'python'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는
배치 파일이 아닙니다.
```

**원인:**
- Python이 설치되지 않음
- PATH 환경 변수에 등록되지 않음

**해결법:**

**단계 1: Python 설치 확인**
```bash
# Windows
where python

# Mac/Linux
which python
which python3
```

**단계 2-A: Mac의 경우**
```bash
# python3로 시도
python3 --version

# 앞으로 모든 명령어에서 python → python3로 변경
python3 collect_etf_data.py
```

**단계 2-B: Windows 재설치**
1. Python 완전 삭제:
   - 설정 → 앱 → Python 제거
2. 다시 다운로드: https://www.python.org/downloads/
3. **중요!** 설치 시 "Add Python to PATH" 체크
4. 컴퓨터 재시작
5. 확인: `python --version`

---

### 오류 2: `pip: command not found`

**화면:**
```
'pip'은(는) 내부 또는 외부 명령이 아닙니다.
```

**원인:**
- pip이 설치되지 않음 (드물게 발생)
- PATH 문제

**해결법:**

**Windows:**
```bash
# 방법 1: python -m 사용
python -m pip install yfinance pandas

# 방법 2: pip 재설치
python -m ensurepip --upgrade
```

**Mac:**
```bash
# python3 사용
python3 -m pip install yfinance pandas

# 또는
pip3 install yfinance pandas
```

---

### 오류 3: `Permission denied` 또는 `Access denied`

**화면:**
```
ERROR: Could not install packages due to an OSError: [Errno 13] Permission denied
```

**원인:**
- 관리자 권한 필요

**해결법:**

**Windows:**
```bash
# --user 플래그 추가 (권장)
pip install yfinance pandas --user

# 또는 관리자 모드로 실행
# 명령 프롬프트를 "관리자 권한으로 실행"
```

**Mac:**
```bash
# --user 플래그 추가
pip3 install yfinance pandas --user

# 또는 sudo (비권장)
sudo pip3 install yfinance pandas
```

---

### 오류 4: `ModuleNotFoundError: No module named 'yfinance'`

**화면:**
```
Traceback (most recent call last):
  File "collect_etf_data.py", line 8, in <module>
    import yfinance as yf
ModuleNotFoundError: No module named 'yfinance'
```

**원인:**
- 패키지 설치 안 됨
- 다른 Python 버전에 설치됨

**해결법:**

**단계 1: 설치 확인**
```bash
pip list | grep yfinance

# Mac/Linux
pip3 list | grep yfinance
```

**단계 2: 없으면 재설치**
```bash
pip install yfinance pandas

# 또는
python -m pip install yfinance pandas
```

**단계 3: Python 버전 확인**
```bash
# 실행 시 사용하는 Python 확인
python --version

# pip가 연결된 Python 확인
python -m pip --version

# 둘이 다르면 문제!
# 해결: python -m pip install ... 사용
```

---

## Node.js 관련 오류

### 오류 5: `npm: command not found`

**화면:**
```
'npm'은(는) 내부 또는 외부 명령이 아닙니다.
```

**원인:**
- Node.js 설치 안 됨
- PATH 문제

**해결법:**

**단계 1: 설치 확인**
```bash
# Windows
where node
where npm

# Mac/Linux
which node
which npm
```

**단계 2: 재설치**
1. 기존 Node.js 제거
2. https://nodejs.org/ 에서 LTS 버전 다운로드
3. 설치 (모두 기본값)
4. 터미널 재시작
5. 확인:
   ```bash
   node --version
   npm --version
   ```

---

### 오류 6: `EACCES: permission denied`

**화면:**
```
npm ERR! code EACCES
npm ERR! syscall access
npm ERR! path /usr/local/lib/node_modules
npm ERR! errno -13
```

**원인:**
- 권한 문제 (주로 Mac/Linux)

**해결법:**

**Mac:**
```bash
# 방법 1: sudo 사용 (간단하지만 비권장)
sudo npm install

# 방법 2: npm 폴더 권한 변경 (권장)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

**Windows:**
- 명령 프롬프트를 "관리자 권한으로 실행"

---

### 오류 7: `npm install` 실행 후 수많은 경고

**화면:**
```
npm WARN deprecated @babel/xxx@x.x.x
npm WARN deprecated core-js@x.x.x
...
(수백 줄의 경고)
```

**원인:**
- 정상입니다! 경고는 무시해도 됨

**해결법:**
- 무시하고 계속 진행
- 마지막에 `added XXX packages in XXs` 나오면 성공

**정말 문제:**
```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
```
이렇게 `ERR!`가 나오면 문제입니다.

---

### 오류 8: `ENOENT: no such file or directory`

**화면:**
```
npm ERR! enoent ENOENT: no such file or directory, open '.../package.json'
```

**원인:**
- 잘못된 폴더에서 실행

**해결법:**
```bash
# 현재 위치 확인
pwd  # Mac/Linux
cd  # Windows

# frontend 폴더로 이동
cd frontend

# 다시 실행
npm install
```

---

## Git 관련 오류

### 오류 9: `git: command not found`

**화면:**
```
'git'은(는) 내부 또는 외부 명령이 아닙니다.
```

**원인:**
- Git 설치 안 됨

**해결법:**

**Windows:**
1. https://git-scm.com/download/win
2. 설치 파일 다운로드 및 실행
3. 모두 기본값으로 Next
4. 터미널 재시작
5. 확인: `git --version`

**Mac:**
```bash
# Homebrew가 있다면
brew install git

# 없다면 Xcode Command Line Tools
xcode-select --install
```

---

### 오류 10: `fatal: not a git repository`

**화면:**
```
fatal: not a git repository (or any of the parent directories): .git
```

**원인:**
- git init을 안 했거나
- 잘못된 폴더에서 실행

**해결법:**
```bash
# 단계 1: 현재 위치 확인
pwd  # Mac/Linux
cd  # Windows

# 단계 2: 프로젝트 루트로 이동
cd /path/to/ETF-Dashboard

# 단계 3: git 초기화
git init
```

---

### 오류 11: `Authentication failed`

**화면:**
```
remote: Support for password authentication was removed.
fatal: Authentication failed for 'https://github.com/...'
```

**원인:**
- GitHub가 비밀번호 인증 중단
- Personal Access Token 필요

**해결법:**

**단계 1: Token 생성**
1. GitHub 로그인
2. 오른쪽 위 프로필 사진 → Settings
3. 왼쪽 맨 아래 "Developer settings"
4. "Personal access tokens" → "Tokens (classic)"
5. "Generate new token (classic)" 클릭
6. 설정:
   ```
   Note: ETF Dashboard
   Expiration: No expiration
   Select scopes:
   ☑️ repo (전체)
   ```
7. 스크롤 다운 → "Generate token"
8. **토큰 복사 (한 번만 보임!)**

**단계 2: 토큰 사용**
```bash
git push -u origin main

# Username: your-github-username
# Password: (여기에 토큰 붙여넣기)
```

**단계 3: 자격 증명 저장 (다음부터 안 물어봄)**
```bash
# Windows
git config --global credential.helper wincred

# Mac
git config --global credential.helper osxkeychain
```

---

### 오류 12: `error: failed to push some refs`

**화면:**
```
error: failed to push some refs to 'https://github.com/...'
hint: Updates were rejected because the remote contains work that you do
hint: not have locally.
```

**원인:**
- GitHub에 있는 파일과 로컬 파일이 다름
- 주로 README.md 자동 생성 때문

**해결법:**

**방법 1: Pull 후 Push (권장)**
```bash
git pull origin main --rebase
git push -u origin main
```

**방법 2: Force Push (주의!)**
```bash
git push -u origin main --force
```

---

## 데이터 수집 오류

### 오류 13: 여러 ETF에서 `❌ 오류` 발생

**화면:**
```
📊 카테고리: 미국_S&P500
  수집 중: SPY... ✅
  수집 중: VOO... ❌ 오류: HTTPError: 404 Client Error
  수집 중: IVV... ✅
  ...
성공: 30개 | 실패: 16개
```

**원인:**
1. 인터넷 연결 불안정
2. API 요청 제한 (Rate Limiting)
3. 티커 심볼 변경/상폐
4. yfinance API 일시적 문제

**해결법:**

**단계 1: 결과 확인**
- 30개 이상 성공하면 괜찮음
- 계속 진행 가능

**단계 2: 재실행**
```bash
# 5분 후 다시 실행
python collect_etf_data.py
```

**단계 3: 특정 ETF 확인**
```python
# Python 대화형 모드에서 테스트
python
>>> import yfinance as yf
>>> etf = yf.Ticker("VOO")
>>> etf.info
```

**단계 4: 실패한 티커 제거**
- `scripts/collect_etf_data.py` 파일 열기
- 계속 실패하는 티커를 리스트에서 제거
- 저장 후 다시 실행

---

### 오류 14: `JSONDecodeError`

**화면:**
```
json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)
```

**원인:**
- yfinance가 비정상 응답 받음
- API 서버 문제

**해결법:**
```bash
# yfinance 업데이트
pip install --upgrade yfinance

# 재실행
python collect_etf_data.py
```

---

### 오류 15: 데이터 파일이 생성되지 않음

**화면:**
프로그램은 완료되었는데 `data/etf_database.json` 파일 없음

**원인:**
- 경로 문제
- 권한 문제

**해결법:**

**단계 1: 현재 위치 확인**
```bash
pwd  # Mac/Linux
cd  # Windows

# scripts 폴더에 있어야 함
# 아니라면:
cd scripts
```

**단계 2: 수동으로 data 폴더 생성**
```bash
cd ..
mkdir data
cd scripts
python collect_etf_data.py
```

**단계 3: 권한 확인**
```bash
# Mac/Linux
ls -la ../data

# 쓰기 권한이 없다면
chmod 755 ../data
```

---

## 프론트엔드 실행 오류

### 오류 16: `Port 3000 is already in use`

**화면:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**원인:**
- 다른 프로그램이 포트 3000 사용 중
- 이전 서버가 종료 안 됨

**해결법:**

**방법 1: 다른 포트 사용**
```bash
npm run dev -- -p 3001

# 브라우저에서
http://localhost:3001
```

**방법 2: 프로세스 종료 (Windows)**
```bash
# 포트 3000 사용 중인 프로세스 찾기
netstat -ano | findstr :3000

# 프로세스 ID (PID) 확인 후 종료
taskkill /PID [PID번호] /F
```

**방법 2: 프로세스 종료 (Mac/Linux)**
```bash
# 포트 3000 사용 프로세스 찾기
lsof -i :3000

# 종료
kill -9 [PID번호]
```

---

### 오류 17: `Module not found: Can't resolve ...`

**화면:**
```
Module not found: Can't resolve 'recharts'
```

**원인:**
- 필요한 패키지가 설치 안 됨

**해결법:**
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules  # Mac/Linux
rmdir /s node_modules  # Windows

npm install
npm run dev
```

---

### 오류 18: 페이지가 비어있음 (빈 화면)

**화면:**
브라우저에 아무것도 안 보임

**원인:**
- JavaScript 오류
- 데이터 파일 없음

**해결법:**

**단계 1: 브라우저 콘솔 확인**
1. F12 또는 Cmd+Option+I (Mac)
2. Console 탭 확인
3. 빨간색 에러 메시지 확인

**단계 2: 데이터 파일 확인**
```bash
# data 폴더에 etf_database.json 있는지 확인
ls data/

# 없으면 샘플 데이터 복사
cp data/etf_database_sample.json data/etf_database.json
```

**단계 3: 서버 재시작**
```bash
Ctrl+C  # 서버 종료
npm run dev  # 재시작
```

---

## 배포 관련 오류

### 오류 19: Vercel - `Build failed`

**화면:**
```
Error: No Output Directory named ".next" found after the Build completed.
```

**원인:**
- Root Directory 설정 안 함
- Build 명령어 오류

**해결법:**

**단계 1: Vercel 프로젝트 설정**
1. Vercel 대시보드 → 프로젝트 선택
2. "Settings" 탭
3. "General" → "Root Directory"
4. 값 입력: `frontend`
5. "Save" 클릭

**단계 2: Build 설정 확인**
```
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**단계 3: 재배포**
1. "Deployments" 탭
2. 최신 배포 옆 "..." 버튼
3. "Redeploy"

---

### 오류 20: Vercel - `404: NOT_FOUND`

**화면:**
배포는 성공했는데 페이지에서 404 오류

**원인:**
- 라우팅 문제
- 파일 경로 오류

**해결법:**

**단계 1: package.json 확인**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

**단계 2: pages 폴더 구조 확인**
```
frontend/
  pages/
    index.js  # 메인 페이지
```

**단계 3: 로그 확인**
- Vercel 대시보드 → 배포 클릭 → "Build Logs"

---

### 오류 21: GitHub Actions - Workflow 실행 안 됨

**화면:**
Actions 탭에 아무것도 없음

**원인:**
- Workflow 파일 위치 오류
- Actions 비활성화

**해결법:**

**단계 1: 파일 위치 확인**
```
.github/
  workflows/
    update_data.yml  # 정확히 이 경로
```

**단계 2: Actions 활성화**
1. 저장소 → Settings
2. Actions → General
3. "Allow all actions and reusable workflows" 선택
4. Save

**단계 3: 수동 실행**
1. Actions 탭
2. "Update ETF Data" 클릭
3. "Run workflow" 버튼
4. 실행 확인

---

## 일반적인 팁

### 터미널 명령어 기초

**현재 위치 확인:**
```bash
pwd  # Mac/Linux
cd  # Windows (매개변수 없이)
```

**폴더 이동:**
```bash
cd folder-name  # 하위 폴더로
cd ..  # 상위 폴더로
cd /absolute/path  # 절대 경로로
```

**파일 목록:**
```bash
ls  # Mac/Linux
dir  # Windows
```

**폴더 만들기:**
```bash
mkdir folder-name
```

**파일 삭제:**
```bash
rm file-name  # Mac/Linux
del file-name  # Windows
```

---

### VS Code 단축키

**터미널 열기/닫기:**
- `Ctrl + ` (백틱)` (Windows)
- `Cmd + `` (Mac)

**파일 검색:**
- `Ctrl + P` (Windows)
- `Cmd + P` (Mac)

**저장:**
- `Ctrl + S` (Windows)
- `Cmd + S` (Mac)

**전체 검색:**
- `Ctrl + Shift + F` (Windows)
- `Cmd + Shift + F` (Mac)

---

### 로그 확인 방법

**Python 오류 전체 메시지 보기:**
```bash
python collect_etf_data.py 2>&1 | tee log.txt
```
→ log.txt 파일에 모든 출력 저장

**npm 상세 로그:**
```bash
npm install --verbose
```

**Git 상세 출력:**
```bash
git push --verbose
```

---

## 🆘 그래도 안 되면?

1. **에러 메시지 전체 복사**
2. **발생 단계 명시**
3. **운영체제 명시** (Windows 10, Mac OS 14 등)
4. **실행한 명령어 나열**
5. **GitHub Issues에 질문 올리기**

**좋은 질문 예시:**
```
제목: [오류] npm install 실행 시 EACCES 오류

환경:
- OS: Windows 11
- Node.js 버전: v20.10.0
- npm 버전: 10.2.3

실행한 명령어:
cd frontend
npm install

오류 메시지:
npm ERR! code EACCES
npm ERR! syscall access
...
(전체 에러 메시지)

시도한 해결법:
1. 관리자 권한으로 실행 → 동일 오류
2. npm cache clean --force → 동일 오류
```

---

**포기하지 마세요! 모든 오류는 해결할 수 있습니다! 💪**
