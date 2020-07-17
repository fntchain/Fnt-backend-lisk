CREATE TABLE IF NOT EXISTS "prize_pool" (
    "id"            serial PRIMARY KEY,
	"assets_id"    BIGINT  NOT NULL,
	"period"        BIGINT       NOT NULL,
	"pool"         VARCHAR(30)       NOT NULL
);

INSERT INTO "prize_pool" VALUES (1, 9, 10000, 3000);
INSERT INTO "prize_pool" VALUES (2, 7, 10000, 3000);
INSERT INTO "prize_pool" VALUES (3, 8, 10000, 3000);
INSERT INTO "prize_pool" VALUES (4, 5, 10000, 3000);
INSERT INTO "prize_pool" VALUES (5, 4, 10000, 3000);
INSERT INTO "prize_pool" VALUES (6, 6, 10000, 3000);