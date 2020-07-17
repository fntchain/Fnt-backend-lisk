
 CREATE TABLE IF NOT EXISTS "assets" (
	"id"            serial  PRIMARY KEY,
	"assets_name"   VARCHAR(50)    NOT NULL,
    "api_assets_name"   VARCHAR(50)    NOT NULL,
    "icon"             VARCHAR(100)    NOT NULL,
    "start_time"      BIGINT     NOT NULL,
    "seal_time"      BIGINT     NOT NULL,
    "pool_amount"      BIGINT     NOT NULL,
    "lowest_amount"      BIGINT     NOT NULL,
    "issue"      BIGINT     NOT NULL,
    "interval"       INT        NOT NULL,
    "region"         VARCHAR(255)    NOT NULL
);
INSERT INTO "assets" VALUES (9, 'LSK', 'lisk', 'http://lisk.first.vip/1214.png', 1592971500, 30, 3000, 1000, 10000, 180, '[{"region":0.001,"percentage":70},{"region":0.003,"percentage":20},{"region":0.005,"percentage":10}]');
INSERT INTO "assets" VALUES (7, 'BNT', 'bancor', 'http://lisk.first.vip/1727.png', 1592980200, 60, 3000, 1000, 10000, 300, '[{"region":0.001,"percentage":70},{"region":0.003,"percentage":20},{"region":0.005,"percentage":10}]');
INSERT INTO "assets" VALUES (8, 'Storj', 'storj', 'http://lisk.first.vip/1772.png', 1592932860, 60, 3000, 1000, 10000, 300, '[{"region":0.001,"percentage":70},{"region":0.003,"percentage":20},{"region":0.005,"percentage":10}]');
INSERT INTO "assets" VALUES (5, 'LEND', 'ethlend  ', 'http://lisk.first.vip/2239.png', 1592967420, 60, 3000, 1000, 10000, 300, '[{"region":0.001,"percentage":70},{"region":0.003,"percentage":20},{"region":0.005,"percentage":10}]');
INSERT INTO "assets" VALUES (4, 'Bitcoin', 'bitcoin', 'http://lisk.first.vip/1 (1).png', 1592967120, 60, 3000, 1000, 10000, 300, '[{"region":1,"percentage":70},{"region":5,"percentage":20},{"region":8,"percentage":10}]');
INSERT INTO "assets" VALUES (6, 'ETH', 'ethereum   ', 'http://lisk.first.vip/1027.png', 1592967480, 60, 3000, 1000, 10000, 300, '[{"region":0.1,"percentage":70},{"region":0.5,"percentage":20},{"region":1,"percentage":10}]');


