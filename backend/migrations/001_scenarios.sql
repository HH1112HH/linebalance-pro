-- Phase 4 scenario persistence, schema version 1.
-- Apply with: python scripts/migrate.py --apply
-- Do not edit after it has been applied to any environment.

CREATE TABLE IF NOT EXISTS schema_migrations (
    version     text PRIMARY KEY,
    checksum    text NOT NULL,
    applied_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenarios (
    id                      uuid PRIMARY KEY,
    workspace_id            text NOT NULL
        CHECK (workspace_id ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
    name                    text NOT NULL
        CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
    line_name               text NOT NULL
        CHECK (char_length(line_name) <= 120),
    style_code              text NOT NULL
        CHECK (char_length(style_code) <= 80),
    data_policy             text NOT NULL DEFAULT 'synthetic-demo-only'
        CHECK (data_policy = 'synthetic-demo-only'),

    status                  text NOT NULL
        CHECK (status IN ('OPTIMAL', 'FEASIBLE_LIMIT')),
    solver_status           text NOT NULL
        CHECK (char_length(solver_status) <= 80),
    solver_version          text NOT NULL
        CHECK (char_length(solver_version) <= 120),
    model_version           text NOT NULL
        CHECK (char_length(model_version) <= 80),
    app_version             text NOT NULL
        CHECK (char_length(app_version) <= 40),
    data_version            text NOT NULL
        CHECK (char_length(data_version) <= 64),
    input_hash              text NOT NULL
        CHECK (input_hash ~ '^[0-9a-f]{64}$'),

    workers_used            integer NOT NULL
        CHECK (workers_used BETWEEN 0 AND 100),
    stations_used           integer NOT NULL
        CHECK (stations_used BETWEEN 0 AND 200),
    balance_efficiency_pct  numeric(5, 2) NOT NULL
        CHECK (balance_efficiency_pct BETWEEN 0 AND 100),

    result_origin           text NOT NULL DEFAULT 'server-solve'
        CHECK (result_origin = 'server-solve'),
    schema_version          integer NOT NULL DEFAULT 1
        CHECK (schema_version >= 1),

    request_json            jsonb NOT NULL
        CHECK (jsonb_typeof(request_json) = 'object'),
    result_json             jsonb NOT NULL
        CHECK (jsonb_typeof(result_json) = 'object'),
    request_bytes           integer NOT NULL
        CHECK (request_bytes BETWEEN 1 AND 1500000),
    result_bytes            integer NOT NULL
        CHECK (result_bytes BETWEEN 1 AND 1500000),

    idempotency_key         text
        CHECK (
            idempotency_key IS NULL
            OR idempotency_key ~ '^[A-Za-z0-9._:-]{8,64}$'
        ),

    created_at              timestamptz NOT NULL DEFAULT now(),

    CHECK (octet_length(request_json::text) <= 1500000),
    CHECK (octet_length(result_json::text) <= 1500000)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_scenarios_idempotency
    ON scenarios (workspace_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_scenarios_workspace_created
    ON scenarios (workspace_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS ix_scenarios_workspace_style
    ON scenarios (workspace_id, style_code, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_scenarios_workspace_hash
    ON scenarios (workspace_id, input_hash);

CREATE TABLE IF NOT EXISTS scenario_audit (
    id            bigserial PRIMARY KEY,
    scenario_id   uuid NOT NULL,
    workspace_id  text NOT NULL,
    action        text NOT NULL
        CHECK (action IN ('create', 'delete')),
    actor_label   text NOT NULL
        CHECK (char_length(actor_label) <= 80),
    request_id    text
        CHECK (request_id IS NULL OR char_length(request_id) <= 80),
    detail        jsonb NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(detail) = 'object'),
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_scenario_audit_workspace_created
    ON scenario_audit (workspace_id, created_at DESC);
