CREATE TABLE IF NOT EXISTS "user_record" (
    "id"            serial PRIMARY KEY,
	"assets_id"     BIGINT  NOT NULL,
	"period"        BIGINT       NOT NULL,
	"guess_price"   VARCHAR(30)       NOT NULL,
    "address"       VARCHAR(30)       NOT NULL,
    "amount"        VARCHAR(30)       NOT NULL,
    "guess_time"    BIGINT           NOT NULL,
    "state"         INT              NOT NULL,
    "price"        VARCHAR(30),      
    "profit"       VARCHAR(30)
);