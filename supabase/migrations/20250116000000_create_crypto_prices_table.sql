-- Create crypto_prices table
CREATE TABLE IF NOT EXISTS crypto_prices (
  id BIGSERIAL PRIMARY KEY,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bitcoin_price NUMERIC,
  bitcoin_change_24h NUMERIC,
  ethereum_price NUMERIC,
  ethereum_change_24h NUMERIC,
  solana_price NUMERIC,
  solana_change_24h NUMERIC,
  UNIQUE(fetched_at)
);

-- Create index for faster queries
CREATE INDEX idx_crypto_prices_fetched_at ON crypto_prices(fetched_at DESC);

-- Enable Row Level Security
ALTER TABLE crypto_prices ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON crypto_prices
  FOR SELECT USING (true);
