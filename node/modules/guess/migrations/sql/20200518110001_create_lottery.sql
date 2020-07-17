CREATE TABLE IF NOT EXISTS "lottery" (
    "id"            serial PRIMARY KEY,
	"project_id"    BIGINT  NOT NULL,
	"period"        BIGINT       NOT NULL,
	"price"         VARCHAR(30)       NOT NULL
);