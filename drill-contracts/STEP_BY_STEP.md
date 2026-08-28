# Deploy DRILL Contracts (Testnet) — dari nol

Kerjakan di laptop, urut dari atas. Jangan loncat.

## A. Persiapan wallet

1. Buka Tonkeeper.
2. Settings → aktifkan **Testnet**.
3. Isi TON testnet (faucet).
4. Siapkan 3 address:
   - ADMIN = wallet yang kamu pakai deploy
   - TREASURY = wallet penerima token reward WD
   - LIQUID = wallet untuk likuiditas (boleh sama dulu dengan ADMIN)

## B. Ambil kode

```bash
git clone https://github.com/bayyubenjamin/DRILL.git
cd DRILL/drill-contracts
npm install
```

## C. Compile

```bash
npx blueprint build --all
```

Kalau sukses, folder `build/` terisi.
Kalau error Tact, copy error-nya. Jangan deploy sebelum build lolos.

## D. Deploy token $DRILL

```bash
npx blueprint run deployDrillJetton --testnet --tonconnect
```

- Pilih network: **testnet**
- Pilih wallet: **TON Connect**
- Scan QR Tonkeeper testnet, approve

Terminal akan print:

```
DRILL minter: EQ....
```

Salin address itu.
Cek: https://testnet.tonscan.org/address/EQ....

## E. Deploy SBT pass

```bash
npx blueprint run deployDrillPass --testnet --tonconnect
```

Salin address collection.
Harga awal = 1 TON testnet. Bisa diubah nanti lewat `SetPrice`.

## F. Mint $DRILL ke treasury

Ganti address di perintah ini:

```bash
export MINTER_ADDRESS="EQ...minter..."
export TREASURY_ADDRESS="EQ...treasury..."
export MINT_AMOUNT="1000000"

npx blueprint run mintDrill --testnet --tonconnect
```

Artinya admin mint **1.000.000 DRILL** ke treasury.
Ulangi dengan `TREASURY_ADDRESS` = wallet liquid kalau mau mint untuk liquid.

Jangan mint 10B sekaligus.

## G. Tes SBT

Dari Tonkeeper testnet kirim pesan `BuyPass` ke collection + **1 TON**.
Atau admin kirim `AdminMint` ke address kamu.

Cek item SBT di Tonscan. Transfer harus gagal.

## H. Colok Mini App

Vercel env:

```
NEXT_PUBLIC_TON_NETWORK=testnet
NEXT_PUBLIC_DRILL_JETTON_MASTER=EQ...minter...
NEXT_PUBLIC_NFT_COLLECTION_ADDRESS=EQ...collection...
```

Treasury jetton wallet (bukan address TON biasa) didapat dari getter minter `get_wallet_address(treasury)`.

```
TREASURY_JETTON_WALLET_ADDRESS=EQ...
```

## I. Yang tidak boleh

- Commit mnemonic
- Deploy mainnet sebelum tes mint + buy pass + transfer token
- Kasih cap 10B ke satu wallet sekaligus
