# Mainnet launch pack

Icon, cover, and public URLs are placeholders. Edit these files by hand before deploy:

- `public/icon.png` — token + TonConnect icon
- `public/drill-pass.png` — SBT image (recommended 512x512 PNG)
- `public/drill-pass-cover.png` — optional cover
- `public/drill.json` — token metadata (`image` URL)
- `public/drill-pass.json` — SBT metadata (`image` / `cover_image` / `external_url`)
- `public/tonconnect-manifest.json` — `url`, `name`, `iconUrl`
- `.env.example` → Vercel / `.env.local`
- `drill-contracts/.env` — `METADATA_URL`, `PASS_METADATA_URL`, mint price

## 1. Assets

Replace placeholder images. Keep HTTPS URLs that will not change after deploy. Wallets cache metadata.

## 2. Rebuild contracts

```bash
cd drill-contracts
npx blueprint build --all
```

Confirm SBT on **testnet Tonkeeper Collectibles** first.

## 3. Deploy mainnet

Use a funded **mainnet** admin wallet. Do not reuse the testnet collection/minter addresses.

```bash
npx blueprint run deployDrillJetton --mainnet --mnemonic
npx blueprint run deployDrillPass --mainnet --mnemonic
npx blueprint run mintDrill --mainnet --mnemonic
```

Save:

- Jetton master → `NEXT_PUBLIC_DRILL_JETTON_MASTER`
- Pass collection → `NEXT_PUBLIC_NFT_COLLECTION_ADDRESS`

## 4. Mini App env (Vercel)

```
NEXT_PUBLIC_TON_NETWORK=mainnet
NEXT_PUBLIC_DRILL_JETTON_MASTER=EQ...
NEXT_PUBLIC_NFT_COLLECTION_ADDRESS=EQ...
NEXT_PUBLIC_TON_CONNECT_MANIFEST_URL=https://YOUR_DOMAIN/tonconnect-manifest.json
NEXT_PUBLIC_TWA_RETURN_URL=https://t.me/YOUR_BOT/app
NEXT_PUBLIC_MINT_PRICE_TON=1
NEXT_PUBLIC_MINT_SEND_TON=1.15
```

RPC/indexers switch automatically when `NEXT_PUBLIC_TON_NETWORK=mainnet`.

## 5. Supabase (once)

Run in SQL editor:

- `supabase/tasks.sql`
- `supabase/referral-pools.sql`
- `supabase/withdrawals.sql`

Prefer a fresh production project. Do not mix testnet users with mainnet.

## 6. Smoke test

- Connect mainnet wallet in app
- Mint pass → PASS badge + Collectibles in Tonkeeper
- Mining claim
- Task claim +5
- Referral valid pool + friends 5% claim to engine
- Withdraw history pending/valid + tx hash

## 7. Do not skip

- Admin mnemonic stays offline, never in Vercel
- Metadata URLs stay online after launch
- Testnet addresses must not be pasted into mainnet env
