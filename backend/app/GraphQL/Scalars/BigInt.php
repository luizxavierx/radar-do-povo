<?php

declare(strict_types=1);

namespace App\GraphQL\Scalars;

use GraphQL\Error\Error;
use GraphQL\Language\AST\IntValueNode;
use GraphQL\Language\AST\Node;
use GraphQL\Type\Definition\ScalarType;

final class BigInt extends ScalarType
{
    public string $name = 'BigInt';
    public ?string $description = 'Escalar para inteiros 64-bit serializados como string.';

    public function serialize($value): string
    {
        if (!is_int($value) && !is_string($value)) {
            throw new Error('BigInt serializa apenas int|string');
        }

        return (string) $value;
    }

    public function parseValue($value): string
    {
        if (is_int($value)) {
            return (string) $value;
        }

        if (is_string($value) && preg_match('/^-?\d+$/', $value) === 1) {
            return $value;
        }

        throw new Error('BigInt espera inteiro valido');
    }

    public function parseLiteral(Node $valueNode, ?array $variables = null): string
    {
        if ($valueNode instanceof IntValueNode) {
            return $valueNode->value;
        }

        throw new Error('BigInt espera literal inteiro');
    }
}
