# Deploy na EC2 Ubuntu (porta 8081)

## 1) Pre-requisitos de rede

- Security Group da EC2:
  - Entrada `8081/tcp` (origem desejada para clientes)
- Security Group do RDS:
  - Entrada `5432/tcp` liberada para o SG da EC2
- Security Group do Redis/ElastiCache:
  - Entrada `6379/tcp` liberada para o SG da EC2

## 2) Provisionamento

```bash
cd /srv/api-radar
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

## 5) Subir API

```bash
APP_PORT=8081 ./scripts/start-api.sh
```

## 6) Teste rapido

```bash
curl -s http://127.0.0.1:8081/healthz
curl -s http://127.0.0.1:8081/api/healthz
curl -s -X POST http://127.0.0.1:8081/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health { status db redis timestamp } }"}'
```

## 7) Opcional: aplicar indices adicionais

```bash
psql "host=radardopovo.cv2iu4y4oqkv.us-east-2.rds.amazonaws.com port=5432 dbname=postgres user=radardopovo sslmode=verify-full sslrootcert=/certs/global-bundle.pem" \
  -f database/sql/001_performance_indexes.sql
```
