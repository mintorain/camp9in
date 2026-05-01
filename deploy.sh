#!/bin/bash
export PATH=/usr/local/bin:$PATH
cd /volume3/web/camp9in
git pull
rm -f .next/lock
# 의존성 변경 자동 반영 (package.json 변경 시 새 패키지 설치)
npm install --no-audit --no-fund
npm run build
mkdir -p .next/standalone/.next
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# PM2로 실행 (자동 재시작, 크래시 복구)
export DB_HOST=localhost
export DB_PORT=4006
export DB_USER=root
export DB_PASSWORD='Endhs7rydbr!'
export DB_NAME=camp9in
export ADMIN_PASSWORD='endhs7rydbr!'
export PORT=3900

# PM2가 없으면 설치
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi

# 기존 프로세스 중지 후 재시작
pm2 stop camp9in 2>/dev/null || true
pm2 delete camp9in 2>/dev/null || true
pm2 start .next/standalone/server.js \
  --name camp9in \
  --log nohup.out \
  --time \
  --max-restarts 10 \
  --restart-delay 3000 \
  --node-args="--max-old-space-size=512"

pm2 save
echo "Deploy complete! (PM2 managed)"
