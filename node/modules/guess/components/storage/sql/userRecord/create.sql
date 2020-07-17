INSERT INTO "user_record" (
    "assets_id",
	"period",
	"guess_price",
    "address",
    "amount",
    "guess_time",
    "state"
) VALUES
    (${assets_id},${period},${guess_price},${address},${amount},${guess_time},${state});