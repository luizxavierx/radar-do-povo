# Execucao como servico systemd

Crie o arquivo:

`/etc/systemd/system/api-radar.service`

```ini
[Unit]
Description=API Radar do Povo (Laravel GraphQL)
After=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/srv/api-radar
Environment=APP_ENV=production
Environment=APP_PORT=8081
ExecStart=/usr/bin/php artisan serve --host=0.0.0.0 --port=8081
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Aplicar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable api-radar
sudo systemctl restart api-radar
sudo systemctl status api-radar
```
