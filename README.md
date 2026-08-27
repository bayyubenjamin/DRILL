# ⚡ DRILL NETWORK — DRILL ENGINE

> Industrial + Futuristic + Dark + Minimal Web3 Telegram Mini App built on TON Testnet and Supabase.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14+ (App Router, TypeScript, Tailwind CSS)
- **State Management:** Zustand
- **Animations:** Framer Motion, Lucide Icons
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Service Role API)
- **TON Ecosystem:** @tonconnect/ui-react, @ton/ton, @twa-dev/sdk
- **Smart Contracts:** Tact (TON Testnet)

---

## 🚀 Core Features

1. **Off-Chain Mining Engine:** Real-time visual increment with server-side authoritative validation and atomic claim logic.
2. **Dynamic Level Progression:** Non-linear level calculator based on total $DRILL balance.
3. **Task System:** Interactive tasks with strict anti-double-claim protection (`UNIQUE` constraints).
4. **Referral System:** Telegram `startapp` link generation and automated energy transfer rewards.
5. **TON Wallet & NFT Access:** TonConnect integration for Testnet wallets with Mining NFT access verification.
6. **Genesis Season & Halving:** 30-day locked withdrawal phase with automated quarterly halving emission logic.

---

## ⚙️ Environment Variables

Buat file `.env.local` di lingkungan lokal Anda berdasarkan template berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

TELEGRAM_BOT_TOKEN=your_telegram_bot_token

NEXT_PUBLIC_TON_NETWORK=testnet
NEXT_PUBLIC_TON_CONNECT_MANIFEST_URL=[https://your-domain.vercel.app/tonconnect-manifest.json](https://your-domain.vercel.app/tonconnect-manifest.json)
TON_RPC_URL=[https://testnet.toncenter.com/api/v2/jsonRPC](https://testnet.toncenter.com/api/v2/jsonRPC)
TON_TESTNET_MNEMONIC="word1 word2 ... word24"

GENESIS_START_TIMESTAMP=1725148800
NEXT_PUBLIC_NFT_COLLECTION_ADDRESS=your_testnet_nft_collection_address
