<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Contracts\Repositories\PoliticoRepositoryInterface;
use Illuminate\Support\Facades\DB;

final class PostgresPoliticoRepository implements PoliticoRepositoryInterface
{
    public function findById(string $id): ?array
    {
        $row = DB::table('politicos')
            ->where('id', $id)
            ->limit(1)
            ->first();

        return $row ? (array) $row : null;
    }

    public function findByNomeCanonico(string $nomeCanonico): ?array
    {
        $row = DB::table('politicos')
            ->where('nome_canonico', $nomeCanonico)
            ->limit(1)
            ->first();

        return $row ? (array) $row : null;
    }

    public function list(array $filters, int $limit, int $offset): array
    {
        $query = DB::table('politicos');

        if (!empty($filters['search'])) {
            $search = '%' . trim((string) $filters['search']) . '%';
            $query->where(function ($q) use ($search): void {
                $q->where('nome_canonico', 'ILIKE', $search)
                    ->orWhere('nome_completo', 'ILIKE', $search)
                    ->orWhere('nome_busca', 'ILIKE', $search);
            });
        }

        if (!empty($filters['partido'])) {
            $query->where('partido', $filters['partido']);
        }

        if (!empty($filters['uf'])) {
            $query->where('uf', $filters['uf']);
        }

        if (!empty($filters['cargoAtual'])) {
            $query->where('cargo_atual', $filters['cargoAtual']);
        }

        $total = (clone $query)->count();

        $nodes = $query
            ->orderBy('nome_canonico')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->map(static fn ($row): array => (array) $row)
            ->all();

        return [
            'nodes' => $nodes,
            'total' => (int) $total,
        ];
    }
}
