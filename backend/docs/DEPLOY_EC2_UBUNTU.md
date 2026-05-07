# Deploy na EC2 Ubuntu/VPS (mesmo dominio)

## 1) Pre-requisitos de rede

- Security Group da EC2/VPS:
  - Entrada `80/tcp` e `443/tcp` para o publico
  - Nao exponha `8081/tcp` publicamente; o Laravel deve escutar em `127.0.0.1:8081`
- Security Group do RDS:
  - Entrada `5432/tcp` liberada para o SG da EC2
- Security Group do Redis/ElastiCache:
  - Entrada `6379/tcp` liberada para o SG da EC2

## 2) Provisionamento

```bash
cd /www/wwwroot/radardopovo.com/backend
chmod +x scripts/setup-ec2.sh
./scripts/setup-ec2.sh
```

## 3) Configurar ambiente

```bash
cp .env.example .env
nano .env
```

Campos obrigatorios para o seu caso:

```env
APP_URL=https://radardopovo.com
APP_HOST=127.0.0.1
APP_PORT=8081

DB_CONNECTION=pgsql
DB_HOST=radardopovo.cv2iu4y4oqkv.us-east-2.rds.amazonaws.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=radardopovo
DB_PASSWORD=radardopovo
DB_SSLMODE=verify-full
DB_SSL_ROOT_CERT=/certs/global-bundle.pem
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PORT=26739
REDIS_PASSWORD=SENHA_FORTE_REDIS

IMPOSTOMETRO_API_URL=
IMPOSTOMETRO_API_TOKEN=
IMPOSTOMETRO_CACHE_TTL_SECONDS=300
```

## 4) Instalar dependencias e otimizar

Verifique versao do Composer:

```bash
composer --version
```

Deve ser Composer 2.2+ (recomendado 2.8+).

Depois rode:

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan config:cache
php artisan route:cache
php artisan lighthouse:cache
```

## 4.1) Redis via Docker (recomendado no seu servidor)

```bash
export REDIS_PASSWORD='SENHA_FORTE_REDIS'
docker compose -f docker-compose.redis.yml up -d
docker ps | grep api-radar-redis
docker exec -it api-radar-redis redis-cli -a "$REDIS_PASSWORD" ping
```

## 5) Subir API como systemd

```bash
sudo cp deploy/api-radar.service /etc/systemd/system/api-radar.service
sudo systemctl daemon-reload
sudo systemctl enable api-radar
sudo systemctl restart api-radar
sudo systemctl status api-radar
```

## 6) Configurar Apache no dominio principal

Habilite os modulos necessarios:

```bash
sudo a2enmod proxy proxy_http rewrite headers
```

Use o template `deploy/apache-radardopovo.conf` como base do vhost do dominio
`radardopovo.com`. Ele serve o build do frontend em `dist/` e encaminha:

- `/graphql` -> `http://127.0.0.1:8081/graphql`
- `/api/*` -> `http://127.0.0.1:8081/api/*`
- `/healthz` -> `http://127.0.0.1:8081/healthz`

Depois valide e recarregue:

```bash
sudo apachectl configtest
sudo systemctl reload apache2
```

## 7) Teste rapido local

```bash
curl -s http://127.0.0.1:8081/healthz
curl -s http://127.0.0.1:8081/api/healthz
curl -s -X POST http://127.0.0.1:8081/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health { status db redis timestamp } }"}'
```

## 8) Teste rapido pelo dominio

```bash
curl -s https://radardopovo.com/api/healthz
curl -s https://radardopovo.com/api/emendas/rankings/resumo
curl -s https://radardopovo.com/api/impostometro
curl -s -X POST https://radardopovo.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health { status db redis timestamp } }"}'
```

## 9) Opcional: aplicar indices adicionais

```bash
psql "host=radardopovo.cv2iu4y4oqkv.us-east-2.rds.amazonaws.com port=5432 dbname=postgres user=radardopovo sslmode=verify-full sslrootcert=/certs/global-bundle.pem" \
  -f database/sql/001_performance_indexes.sql
```
