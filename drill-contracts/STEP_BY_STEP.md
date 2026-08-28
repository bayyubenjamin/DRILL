# Deploy pakai phrase (tanpa scan)

Phrase hanya di file `.env` lokal. Jangan commit. Jangan kirim ke chat.

## 1. Masuk folder

```bash
cd DRILL/drill-contracts
npm install
```

## 2. Isi phrase admin

```bash
cp .env.example .env
nano .env
```

Isi:

```
WALLET_MNEMONIC="satu dua tiga ... dua-puluh-empat"
WALLET_VERSION=v4
```

Kalau Tonkeeper kamu v5:

```
WALLET_VERSION=v5r1
```

Simpan. Wallet ini = ADMIN.

## 3. Compile

```bash
npx blueprint build --all
```

## 4. Deploy token

```bash
npx blueprint run deployDrillJetton --testnet --mnemonic
```

Kalau ditanya network/wallet: testnet + mnemonic.
Salin address minter.

## 5. Deploy SBT

```bash
npx blueprint run deployDrillPass --testnet --mnemonic
```

## 6. Mint ke treasury

Edit `.env`:

```
MINTER_ADDRESS=EQ...hasil-deploy-minter...
TREASURY_ADDRESS=EQ...wallet-treasury...
MINT_AMOUNT=1000000
```

Lalu:

```bash
npx blueprint run mintDrill --testnet --mnemonic
```

## Catatan

- `.env` sudah ada di `.gitignore`
- Phrase = kunci admin. Kalau bocor, token bisa dimint orang lain
- Pakai wallet testnet yang ada saldonya
