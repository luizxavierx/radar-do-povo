<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;

final class ImpostometroUnavailableException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $statusCode = 503,
    ) {
        parent::__construct($message);
    }
}
