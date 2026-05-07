<?php

declare(strict_types=1);

return [
    'senado' => [
        'base_url' => env('SENADO_BASE_URL', 'https://legis.senado.leg.br/dadosabertos'),
    ],

    'tse' => [
        'portal_base_url' => env('TSE_PORTAL_BASE_URL', 'https://dadosabertos.tse.jus.br'),
        'candidatos_cdn_base_url' => env('TSE_CANDIDATOS_CDN_BASE_URL', 'https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand'),
        'divulgacandcontas_url' => env('TSE_DIVULGACANDCONTAS_URL', 'https://divulgacandcontas.tse.jus.br'),
    ],

    'lexml' => [
        'search_url' => env('LEXML_SEARCH_URL', 'https://www.lexml.gov.br/busca/search'),
        'sru_url' => env('LEXML_SRU_URL', ''),
    ],

    'brasilio' => [
        'base_url' => env('BRASILIO_BASE_URL', 'https://brasil.io'),
        'token' => env('BRASILIO_TOKEN', ''),
        'eleicoes_dataset_path' => env('BRASILIO_ELEICOES_DATASET_PATH', '/api/dataset/eleicoes-brasil/candidatos/data/'),
    ],
];
