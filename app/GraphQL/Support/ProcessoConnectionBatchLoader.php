<?php

declare(strict_types=1);

namespace App\GraphQL\Support;

use Closure;
use GraphQL\Deferred;

final class ProcessoConnectionBatchLoader
{
    /**
     * @var array<int,string>
     */
    private array $queuedProcessoIds = [];

    /**
     * @var array<string,array{nodes: array<int,array<string,mixed>>, total: int}>
     */
    private array $resolved = [];

    private bool $isResolved = false;

    /**
     * @param Closure(array<int,string>): array<string,array{nodes: array<int,array<string,mixed>>, total: int}> $batchResolver
     */
    public function __construct(private readonly Closure $batchResolver) {}

    public function load(string $processoId): Deferred
    {
        $this->queuedProcessoIds[$processoId] = $processoId;

        return new Deferred(fn (): array => $this->resolveFor($processoId));
    }

    /**
     * @return array{nodes: array<int,array<string,mixed>>, total: int}
     */
    public function resolveFor(string $processoId): array
    {
        if (!$this->isResolved) {
            $this->resolve();
        }

        return $this->resolved[$processoId] ?? [
            'nodes' => [],
            'total' => 0,
        ];
    }

    private function resolve(): void
    {
        $processoIds = array_values($this->queuedProcessoIds);
        if ($processoIds === []) {
            $this->isResolved = true;
            return;
        }

        /** @var array<string,array{nodes: array<int,array<string,mixed>>, total: int}> $resolved */
        $resolved = call_user_func($this->batchResolver, $processoIds);
        $this->resolved = $resolved;
        $this->isResolved = true;
    }
}
