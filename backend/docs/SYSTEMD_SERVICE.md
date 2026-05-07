# Execucao como servico systemd

O backend deve rodar apenas na interface local. O Apache do dominio principal
encaminha `/graphql`, `/api/*` e `/healthz` para `127.0.0.1:8081`.

Use o template versionado:

`deploy/api-radar.service`

Ou crie o arquivo equivalente em:

`/etc/systemd/system/api-radar.service`

```ini
[Unit]
Description=API Radar do Povo (Laravel)
After=network.target

[Service]
Type=simple
User=www
Group=www
WorkingDirectory=/www/wwwroot/radardopovo.com/backend
Environment=APP_ENV=production
Environment=APP_HOST=127.0.0.1
Environment=APP_PORT=8081
ExecStart=/usr/bin/php artisan serve --host=127.0.0.1 --port=8081
Restart=always
RestartSec=5
KillSignal=SIGINT
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
```

Se o usuario de deploy do servidor nao for `www`, ajuste `User` e `Group` para o
usuario dono dos arquivos do projeto.

Aplicar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable api-radar
sudo systemctl restart api-radar
sudo systemctl status api-radar
```
