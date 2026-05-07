<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Artisan;

Artisan::command('radar:ping', function (): void {
    $this->info('pong');
});
