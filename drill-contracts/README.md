# DRILL Contracts

1. `$DRILL` Jetton — cap 10,000,000,000, mint admin only
2. Drill Pass SBT — non-transferable, TEP-62 getters for wallet indexers

## Build

```bash
cd drill-contracts
npm install
npx blueprint build --all
```

## Testnet (verify wallet display first)

```bash
npx blueprint run deployDrillJetton --testnet --mnemonic
npx blueprint run deployDrillPass --testnet --mnemonic
npx blueprint run mintDrill --testnet --mnemonic
```

## Mainnet (only after SBT appears in Tonkeeper testnet)

```bash
npx blueprint run deployDrillJetton --mainnet --mnemonic
npx blueprint run deployDrillPass --mainnet --mnemonic
npx blueprint run mintDrill --mainnet --mnemonic
```

Copy printed addresses into Mini App env:

```
NEXT_PUBLIC_TON_NETWORK=mainnet
NEXT_PUBLIC_DRILL_JETTON_MASTER=EQ...
NEXT_PUBLIC_NFT_COLLECTION_ADDRESS=EQ...
```

Edit metadata URLs in `.env` before deploy:

```
METADATA_URL=https://YOUR_DOMAIN/drill.json
PASS_METADATA_URL=https://YOUR_DOMAIN/drill-pass.json
```
