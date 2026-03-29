@echo off
echo Resetting database...
docker compose down
docker compose up -d
timeout /t 5
npx prisma migrate reset --force
npx prisma generate
echo Database reset complete!
npm run dev
