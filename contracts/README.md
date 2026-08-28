# DRILL Contracts

Two on-chain contracts. Mining, levels, referral, and claim stay off-chain.

## 1. $DRILL Jetton

- Hard cap: **10,000,000,000 DRILL** (9 decimals)
- Cap is immutable
- Only **admin** can mint
- Admin mints to treasury (engine rewards) and/or liquidity wallets
- Users cannot mint
- Admin cannot set another wallet's balance
- Admin cannot freeze user transfers
- `closeMinting()` is one-way
- `changeAdmin()` is for moving control to a multisig later

## 2. Drill Pass SBT

- Soulbound: transfer always rejected
- One pass per wallet
- Admin can `setPrice` at any time (on-chain, publicly readable)
- Public `buy` if sender pays `mintPrice`
- Admin `mintTo` for operations
- Admin can revoke a pass
- Admin withdraws collected TON

## Why this does not look like a hidden mint token

- Supply ceiling is public and cannot grow past 10B
- Remaining mintable supply is a getter
- Price of the SBT is a getter
- No admin function that pulls jettons out of user wallets
- SBT cannot be sold or lent
