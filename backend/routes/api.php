<?php

declare(strict_types=1);

use App\Http\Controllers\HealthController;
use App\Http\Controllers\EmendaRankingRestController;
use App\Http\Controllers\ImpostometroController;
use App\Http\Controllers\MetricsController;
use App\Http\Controllers\NewsRestController;
use App\Http\Controllers\PoliticoDossieRestController;
use App\Http\Controllers\ViagemRestController;
use Illuminate\Support\Facades\Route;

Route::get('/healthz', HealthController::class);
Route::get('/impostometro', ImpostometroController::class);
Route::get('/metrics', MetricsController::class);
Route::get('/news', [NewsRestController::class, 'index']);

Route::prefix('/viagens')->group(function (): void {
    Route::get('/resumo', [ViagemRestController::class, 'resumo']);
    Route::get('/top-viajantes', [ViagemRestController::class, 'topViajantes']);
    Route::get('/top-gastadores', [ViagemRestController::class, 'topGastadores']);
    Route::get('/top-orgaos-superiores', [ViagemRestController::class, 'topOrgaosSuperiores']);
    Route::get('/top-orgaos-solicitantes', [ViagemRestController::class, 'topOrgaosSolicitantes']);
    Route::get('/{processoId}/passagens', [ViagemRestController::class, 'passagens']);
    Route::get('/{processoId}/pagamentos', [ViagemRestController::class, 'pagamentos']);
    Route::get('/{processoId}/trechos', [ViagemRestController::class, 'trechos']);
    Route::get('/{processoId}', [ViagemRestController::class, 'show']);
    Route::get('/', [ViagemRestController::class, 'index']);
});

Route::prefix('/emendas/rankings')->group(function (): void {
    Route::get('/resumo', [EmendaRankingRestController::class, 'resumo']);
    Route::get('/serie-anual', [EmendaRankingRestController::class, 'serieAnual']);
    Route::get('/top-tipos', [EmendaRankingRestController::class, 'topTipos']);
    Route::get('/top-gastadores', [EmendaRankingRestController::class, 'topGastadores']);
    Route::get('/top-paises', [EmendaRankingRestController::class, 'topPaises']);
});

Route::get('/politicos/{idOrNome}/dossie', [PoliticoDossieRestController::class, 'show']);
