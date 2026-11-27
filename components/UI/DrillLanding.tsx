'use client';

import {
  TELEGRAM_BOT_URL,
  TELEGRAM_MINIAPP_DEEP_LINK,
  TELEGRAM_MINIAPP_URL,
} from '@/lib/telegram/detect';

const CHANNEL_URL = 'https://t.me/drillprotocol';

// One clean informative page for regular browsers (drillprotocol.xyz
// outside Telegram). Top of the page points the user to the Mini App;
// below it, the whole DRILL mechanic in plain language. All numbers
// are from Spesifikasi Ekonomi DRILL Frozen v1.0 (19 Nov 2026).
// (Bayu, 27 Nov 2026: "bagian ini dibuat 1 halaman informatif clean
// mekanisme drill dll tapi bagian awal mengarahkan user ke mini apps")

function openTelegram() {
  // Try the native app first, but only fall back to the t.me link if
  // the user is still on this page — an unconditional fallback yanks
  // users back to the browser even after Telegram has opened.
  window.location.href = TELEGRAM_MINIAPP_DEEP_LINK;
  setTimeout(() => {
    if (document.visibilityState === 'visible') {
      window.location.href = TELEGRAM_MINIAPP_URL;
    }
  }, 1200);
}

function Section({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="emboss w-full p-5 text-left">
      <p className="text-[10px] tracking-[0.3em] text-sky-400">{kicker}</p>
      <h2 className="mt-1 text-sm font-bold tracking-widest text-white">{title}</h2>
      <div className="mt-3 space-y-2 text-[12px] leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-bold text-white">{value}</span>
    </div>
  );
}

export default function DrillLanding() {
  return (
    <main className="drill-landing-blue min-h-screen w-full bg-black font-mono text-white">
      {/* Scoped blue overrides: belt-and-braces on top of the blue
          globals.css theme, so the landing cards glow blue even if the
          shared styles drift. */}
      <style>{`
        .drill-landing-blue .emboss {
          background:
            radial-gradient(420px circle at var(--mx) var(--my), rgba(56, 189, 248, 0.12), transparent 46%),
            linear-gradient(165deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 22%, transparent 42%),
            linear-gradient(180deg, #161916 0%, #0a0c0a 100%);
          border: 1px solid rgba(56, 189, 248, 0.16);
        }
        .drill-landing-blue .emboss-ridge {
          box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.06);
        }
        .drill-landing-blue .emboss-sheen {
          background: linear-gradient(115deg, transparent 26%, rgba(56, 189, 248, 0.12) 48%, transparent 66%);
        }
        .drill-landing-blue .emboss-btn {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.38), inset 0 -3px 0 rgba(0, 0, 0, 0.22), 0 10px 22px rgba(56, 189, 248, 0.22);
        }
        .drill-landing-blue .emboss-btn:not(:disabled):active {
          box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.3), 0 3px 10px rgba(56, 189, 248, 0.16);
        }
      `}</style>
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 py-8">
        {/* ---- Top: direct the user to the Mini App ---- */}
        <header className="text-center">
          <img
            src="/drill-banner-v2.png"
            alt="DRILL ENGINE"
            width={766}
            height={460}
            className="w-full rounded-xl border border-sky-400/20"
          />
          <h1 className="mt-4 text-xl font-bold tracking-[0.25em] text-white">DRILL ENGINE</h1>
          <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">
            Mine <span className="font-bold text-sky-400">$DRILL</span> with your own rig on TON.
            Level up, invite friends, withdraw real DRILL.
          </p>
          <a
            href={TELEGRAM_MINIAPP_URL}
            onClick={(e) => {
              e.preventDefault();
              openTelegram();
            }}
            className="emboss-btn mt-5 block w-full bg-sky-400 py-3.5 text-xs font-bold text-black"
          >
            OPEN IN TELEGRAM
          </a>
          <a
            href={TELEGRAM_BOT_URL}
            className="mt-3 block text-[11px] tracking-widest text-zinc-500 underline underline-offset-4"
          >
            t.me/drillengine_bot
          </a>
          <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">
            DRILL only runs as a Telegram Mini App — a regular browser cannot mine, hold a wallet, or claim.
          </p>
        </header>

        {/* ---- How it works ---- */}
        <Section kicker="START HERE" title="HOW IT WORKS">
          <Row label="1. Connect wallet" value="TON wallet in the app" />
          <Row label="2. Mint Drill Pass" value="1 TON · soulbound" />
          <Row label="3. Mine + level up" value="Claim, then withdraw" />
          <p>
            Open the app, connect your TON wallet, mint the Drill Pass, and your rig starts mining. Come back to
            claim — mining pauses after 24 hours without a claim.
          </p>
        </Section>

        {/* ---- Mining mechanics ---- */}
        <Section kicker="MINING" title="THE RIG">
          <Row label="Mining speed" value="0.01 – 0.12 / min" />
          <Row label="Levels" value="1 – 500" />
          <Row label="Offline cap" value="24 hours" />
          <Row label="Emission Q1" value="100,000,000 DRILL" />
          <Row label="Emission total" value="200,000,000 DRILL" />
          <p>
            Speed grows with your level. Mining emission halves every 90 days — Q1 mints 100M, Q2 50M, Q3 25M,
            and so on, until the 200M reserve is done. Each quarter has a hard cap: when it runs out, mining
            pauses until the next quarter.
          </p>
        </Section>

        {/* ---- Drill Pass ---- */}
        <Section kicker="PASS" title="DRILL PASS">
          <Row label="Price" value="1 TON" />
          <Row label="You send" value="1.15 TON" />
          <Row label="Type" value="Soulbound · 1 / wallet" />
          <p>
            The Pass is your mining license — one per wallet, non-transferable. 1 TON goes to the treasury;
            the extra 0.15 TON covers gas and collection float.
          </p>
        </Section>

        {/* ---- Referral ---- */}
        <Section kicker="FRIENDS" title="REFERRAL">
          <Row label="Valid referral" value="+500 DRILL" />
          <Row label="Friend share" value="5% of friend claims" />
          <Row label="Share cap" value="500 / quarter / friend" />
          <p>
            A referral counts as valid once your friend mints the Pass, makes their first mining claim, and 7
            days have passed since they joined. You also earn 5% of every claim they make, capped at 500 DRILL
            per friend per quarter.
          </p>
        </Section>

        {/* ---- Withdraw ---- */}
        <Section kicker="CASH OUT" title="WITHDRAW">
          <Row label="Minimum" value="500 DRILL" />
          <Row label="Fee" value="70 DRILL" />
          <Row label="Max per day" value="5,000 DRILL" />
          <p>Withdrawals go to the wallet bound to your account. No 30-day lock — that rule was removed.</p>
        </Section>

        {/* ---- Token ---- */}
        <Section kicker="TOKEN" title="$DRILL SUPPLY">
          <Row label="Hard cap" value="10,000,000,000" />
          <Row label="Mining reserve" value="200,000,000 (2%)" />
          <Row label="Rewards pool" value="300,000,000 (3%)" />
          <Row label="DEX liquidity" value="1,000,000,000 (10%)" />
          <Row label="Minted at deploy" value="3,000,000,000 (30%)" />
          <p>
            The 10B cap is an upper limit, not a promise to mint it all. 7B stays unminted and is only minted on
            a published schedule. Genesis is the day the Jetton deploys on mainnet.
          </p>
        </Section>

        {/* ---- Status + links ---- */}
        <Section kicker="STATUS" title="WHERE WE ARE">
          <Row label="Testnet" value="Live now" />
          <Row label="Mainnet" value="Coming soon" />
          <p>
            Testnet is live now. Mainnet launches after withdrawals are proven end-to-end. Follow the channel
            for the genesis announcement.
          </p>
          <div className="flex gap-3 pt-1">
            <a href={CHANNEL_URL} className="emboss-btn flex-1 py-2.5 text-center text-[11px] font-bold text-sky-400">
              📢 CHANNEL
            </a>
            <a href={TELEGRAM_BOT_URL} className="emboss-btn flex-1 py-2.5 text-center text-[11px] font-bold text-sky-400">
              🤖 BOT
            </a>
          </div>
        </Section>

        <footer className="pb-4 pt-2 text-center text-[10px] leading-relaxed text-zinc-600">
          DRILL ENGINE — drillprotocol.xyz · Numbers per Frozen v1.0 (19 Nov 2026)
        </footer>
      </div>
    </main>
  );
}
