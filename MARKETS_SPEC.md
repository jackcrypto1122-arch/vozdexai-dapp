# Oraculum — Markets Feature Spec (Robinhood Chain)

## API Routes

### Markets
- `/api/markets/list` — sources live trending pair data from the DEX Screener API, filtered to Robinhood Chain (see Markets Page section below)

## Markets Page: Live Trending Data (DEX Screener)
The Markets page (`/markets`) does **not** use a fixed/curated token list. It shows a **live, dynamic trending table of all pairs currently trading on Robinhood Chain**, sourced from the DEX Screener API filtered to the Robinhood chain — the same kind of table seen at `https://dexscreener.com/robinhood`. This surfaces community/meme tokens and any other pairs with active liquidity, not just official Stock Tokens.

### Data Source
- `/api/markets/list` calls the DEX Screener public API (free tier), filtered to the Robinhood chain ID
- Data refreshes on the existing 30-second market query interval (`useMarkets()`)
- No API key required for the free tier; confirm the exact Robinhood chain slug/ID against DEX Screener's docs at implementation time since it's a newer listing

### Required Columns
The `MarketRow` type and Markets page table must support:
- **Token** (symbol, name, icon, paired against — e.g. `TOKEN / WETH`)
- **Price** (USD)
- **Market Cap**
- **Volume** (24h, and ideally multi-timeframe)
- **Liquidity** (USD)
- **% Change** — multi-timeframe: 5m, 1h, 6h, 24h, each colored red/negative or green/positive per the dark fintech design language
- **Txns / Traders** — buy/sell transaction counts and unique trader counts
- **Age** — time since pair creation

### Sorting/Ranking
- Default view ranks by **Trending** (matching DEX Screener's default), with the ability to re-sort by any column (Top, Gainers, Volume, Liquidity, etc.) — mirror the filter/sort bar pattern (Trending / Top / Gainers / New Pairs / timeframe toggle) since it's a familiar, proven UX for this kind of data.

### Type Update
`MarketRow` (in `src/types/dapp.ts`) should be reshaped to carry: `pairAddress`, `baseToken` (symbol, name, address), `quoteToken` (symbol, e.g. WETH), `priceUsd`, `marketCap`, `liquidityUsd`, `volume` (per timeframe), `priceChange` (per timeframe: 5m/1h/6h/24h), `txns` (per timeframe: buys/sells), `pairCreatedAt`.

### Relationship to Swap Execution
This is purely a **display/discovery layer** — clicking a token here can pre-fill the swap card's "You Receive" field, but the actual swap still executes through the app's own Router/Quoter contract flow, not through DEX Screener.
