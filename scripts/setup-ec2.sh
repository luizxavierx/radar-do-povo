#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -eq 0 ]]; then
  SUDO=""
else
  SUDO="sudo"
fi

$SUDO apt-get update
$SUDO apt-get install -y curl git unzip ca-certificates redis-server postgresql-client software-properties-common

if ! command -v php >/dev/null 2>&1; then
  $SUDO add-apt-repository -y ppa:ondrej/php
  $SUDO apt-get update
  $SUDO apt-get install -y php8.3 php8.3-cli php8.3-fpm php8.3-pgsql php8.3-xml php8.3-mbstring php8.3-curl php8.3-redis
fi

# Forca Composer moderno (Laravel 11 exige composer-runtime-api >= 2.2).
curl -sS https://getcomposer.org/installer -o /tmp/composer-setup.php
$SUDO php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer
rm -f /tmp/composer-setup.php
$SUDO ln -sf /usr/local/bin/composer /usr/bin/composer
composer --version

$SUDO mkdir -p /certs
$SUDO curl -fsSL "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem" -o /certs/global-bundle.pem
$SUDO chmod 644 /certs/global-bundle.pem

echo "Dependencias instaladas. Proximo passo:"
echo "1) cp .env.example .env"
echo "2) composer install --no-dev --optimize-autoloader"
echo "3) php artisan key:generate"
echo "4) php artisan lighthouse:cache"
echo "5) ./scripts/start-api.sh"
