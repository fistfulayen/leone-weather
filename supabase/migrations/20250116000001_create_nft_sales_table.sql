-- Create nft_sales table
CREATE TABLE IF NOT EXISTS nft_sales (
  id BIGSERIAL PRIMARY KEY,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  token_name TEXT NOT NULL,
  collection_name TEXT NOT NULL,
  collection_artist TEXT,
  price_eth NUMERIC NOT NULL,
  price_usd TEXT NOT NULL,
  image_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  sale_timestamp TIMESTAMPTZ NOT NULL,
  token_id TEXT,
  hours_ago INTEGER,
  UNIQUE(token_name, sale_timestamp, platform)
);

-- Create indexes for faster queries
CREATE INDEX idx_nft_sales_fetched_at ON nft_sales(fetched_at DESC);
CREATE INDEX idx_nft_sales_sale_timestamp ON nft_sales(sale_timestamp DESC);
CREATE INDEX idx_nft_sales_price_eth ON nft_sales(price_eth DESC);

-- Enable Row Level Security
ALTER TABLE nft_sales ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON nft_sales
  FOR SELECT USING (true);
