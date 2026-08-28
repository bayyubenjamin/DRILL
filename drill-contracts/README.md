# DRILL Contracts (bersih dari 0)

Hanya 2 kontrak:

1. `$DRILL` Jetton — cap 10.000.000.000, mint hanya admin
2. Drill Pass SBT — tidak bisa transfer, harga diatur admin

Mini App Next.js tidak ikut ke sini.

## Perintah

```bash
cd drill-contracts
npm install
npx blueprint build --all
npx blueprint run deployJetton --testnet --tonconnect
npx blueprint run deploySbt --testnet --tonconnect
npx blueprint run mintDrill --testnet --tonconnect
```

## Setelah deploy

Salin address ke env Mini App:

```
NEXT_PUBLIC_DRILL_JETTON_MASTER=EQ...
NEXT_PUBLIC_NFT_COLLECTION_ADDRESS=EQ...
```
