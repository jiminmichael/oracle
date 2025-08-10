import React, { useState, useEffect } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Copy
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import btcLogo from "@/assets/coins/btc.png";
import ethLogo from "@/assets/coins/eth.png";
import usdtLogo from "@/assets/coins/usdt.png";
import solLogo from "@/assets/coins/solana-logo.png";
import usdcLogo from "@/assets/coins/usdc.png";
import { useQuery } from "@tanstack/react-query";

const COINS = {
  BTC: { id: "bitcoin", name: "Bitcoin", address: "bc1qexamplebtcaddress" },
  ETH: { id: "ethereum", name: "Ethereum", address: "0xExampleEthAddress" },
  USDT: { id: "tether", name: "Tether", address: "TY3ExampleTronUSDT" },
  SOL: { id: "solana", name: "Solana", address: "7GhExampleSolAddress" },
  USDC: { id: "usd-coin", name: "USD Coin", address: "0xExampleUsdcAddress" },
} as const;

const initialHoldings = [
  { symbol: "BTC", amount: 0.8 },
  { symbol: "ETH", amount: 1.1 },
  { symbol: "USDT", amount: 1050.0 },
  { symbol: "SOL", amount: 25.44 },
  { symbol: "USDC", amount: 980.0 },
] as const;

const tokenLogos: Record<string, string> = {
  BTC: btcLogo,
  ETH: ethLogo,
  USDT: usdtLogo,
  SOL: solLogo,
  USDC: usdcLogo,
};

const TokenIcon = ({ symbol, name }: { symbol: string; name: string }) => {
  const src = tokenLogos[symbol];
  return src ? (
    <img src={src} alt={`${name} (${symbol}) logo`} className="w-10 h-10 rounded-full" loading="lazy" />
  ) : (
    <div className="w-10 h-10 rounded-full grid place-items-center bg-zinc-700 text-zinc-300 font-semibold">
      {symbol}
    </div>
  );
};

const Modal = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md shadow-lg border border-zinc-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg text-zinc-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Index = () => {
  // BTC amount state to increase every 12 hours
  const [btcAmount, setBtcAmount] = useState(0.7);

  // Keep other holdings fixed
  const otherHoldings = initialHoldings.filter((h) => h.symbol !== "BTC");

  useEffect(() => {
    const interval = setInterval(() => {
      setBtcAmount((prev) => {
        const newAmount = +(prev + 0.08).toFixed(8);
        console.log(`BTC Holding increased: ${newAmount}`);
        return newAmount;
      });
    }, 12 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const [activeModal, setActiveModal] = useState<null | "send" | "receive" | "buy">(null);
  const { data: prices = {}, isLoading, error } = useQuery({
    queryKey: ["market-prices"],
    queryFn: async () => {
      const ids = Object.values(COINS).map((c) => c.id).join(",");
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      );
      if (!res.ok) throw new Error("Failed to fetch prices");
      const json = await res.json();

      const map: Record<string, { priceUsd: number; changePercent24Hr: number }> = {};
      for (const id of Object.keys(json)) {
        map[id] = {
          priceUsd: Number(json[id].usd),
          changePercent24Hr: Number(json[id].usd_24h_change),
        };
      }
      return map;
    },
    refetchInterval: 60000,
  });

  // Build holdings including updated BTC amount
  const holdings = [
    { symbol: "BTC", amount: btcAmount },
    ...otherHoldings,
  ];

  const assets = holdings.map((h) => {
    const meta = COINS[h.symbol as keyof typeof COINS];
    const price = prices[meta.id]?.priceUsd ?? 0;
    const change = prices[meta.id]?.changePercent24Hr ?? 0;
    return { symbol: h.symbol, name: meta.name, amount: h.amount, fiat: h.amount * price, change };
  });

  const totalFiat = assets.reduce((sum, a) => sum + a.fiat, 0);

  const txs = [
    { id: "1", type: "send" as const, symbol: "ETH", amount: 0.12, counterparty: "0x9f...d21", timestamp: Date.now() - 45 * 60 * 1000 },
    { id: "2", type: "receive" as const, symbol: "USDT", amount: 150, counterparty: "TY3...9p", timestamp: Date.now() - 6 * 60 * 60 * 1000 },
    { id: "3", type: "send" as const, symbol: "SOL", amount: 2.5, counterparty: "7Gh...K2", timestamp: Date.now() - 24 * 60 * 60 * 1000 },
    { id: "4", type: "receive" as const, symbol: "BTC", amount: 0.003, counterparty: "bc1q...7a", timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 },
  ];

  if (isLoading) return <p className="p-4 text-zinc-300">Loading prices...</p>;
  if (error) return <p className="p-4 text-red-500">Failed to load prices</p>;

  return (
    <div className="min-h-screen bg-zinc-900 pb-24 text-zinc-300">
      <header className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur border-b border-zinc-700">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg grid place-items-center bg-zinc-700">
              <Wallet className="w-5 h-5 text-zinc-300" aria-hidden />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Total Balance</p>
              <p className="text-2xl font-bold tracking-tight">${totalFiat.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              {/* <p className="text-xs text-zinc-400 mt-1">BTC Holding: {btcAmount.toFixed(8)} BTC</p> */}
            </div>
          </div>
        </div>
      </header>

      <main className="container space-y-6 pt-4">
        {/* Quick Actions */}
        <section aria-labelledby="quick-actions">
          <div className="grid grid-cols-3 gap-3">
            <Button variant="secondary" className="h-12" onClick={() => setActiveModal("send")}>
              <ArrowUpRight className="mr-2 w-4 h-4" /> Send
            </Button>
            <Button variant="secondary" className="h-12" onClick={() => setActiveModal("receive")}>
              <ArrowDownLeft className="mr-2 w-4 h-4" /> Receive
            </Button>
            <Button variant="secondary" className="h-12" onClick={() => setActiveModal("buy")}>
              <Plus className="mr-2 w-4 h-4" /> Buy
            </Button>
          </div>
        </section>

        {/* Assets */}
        <section aria-labelledby="assets" className="space-y-3">
          <h2 id="assets" className="text-base font-semibold text-zinc-200">Assets</h2>
          <Card className="divide-y border border-zinc-700 bg-zinc-800">
            {assets.map((a) => (
              <article key={a.symbol} className="flex items-center gap-3 p-4 hover:bg-zinc-700 rounded-md transition">
                <TokenIcon symbol={a.symbol} name={a.name} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-zinc-100">{a.name}</p>
                    <p className="font-semibold text-zinc-100">${a.fiat.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span>
                      {a.amount} {a.symbol}
                    </span>
                    <span className={a.change >= 0 ? "text-green-400" : "text-red-500"}>
                      {a.change >= 0 ? "+" : ""}
                      {a.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </Card>
        </section>

        {/* Transactions */}
        <section aria-labelledby="transactions" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="transactions" className="text-base font-semibold text-zinc-200">Transactions</h2>
            <Link to="/transactions" className="text-sm text-green-400 hover:underline">See all</Link>
          </div>
          <Card className="divide-y border border-zinc-700 bg-zinc-800">
            {txs.map((tx) => {
              const meta = COINS[tx.symbol as keyof typeof COINS];
              const price = prices[meta.id]?.priceUsd ?? 0;
              const fiat = tx.amount * price;
              const isReceive = tx.type === "receive";
              return (
                <article key={tx.id} className="flex items-center gap-3 p-4 hover:bg-zinc-700 rounded-md transition">
                  <div className="w-10 h-10 rounded-full grid place-items-center bg-zinc-700">
                    {isReceive ? (
                      <ArrowDownLeft className={`w-5 h-5 text-green-400`} aria-hidden />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-500" aria-hidden />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-zinc-100">
                        {isReceive ? "Received" : "Sent"} {tx.symbol}
                      </p>
                      <p className={`font-semibold ${isReceive ? "text-green-400" : "text-red-500"}`}>
                        {isReceive ? "+" : "-"}
                        {tx.amount} {tx.symbol}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-zinc-400">
                      <span>{isReceive ? "from" : "to"} {tx.counterparty}</span>
                      <span>
                        ${fiat.toLocaleString(undefined, { maximumFractionDigits: 2 })} • {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </Card>
        </section>
      </main>

      {/* Modals */}
      {activeModal === "send" && (
        <Modal title="Send Crypto" onClose={() => setActiveModal(null)}>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-200">Recipient Address</label>
              <input className="border border-zinc-600 bg-zinc-800 text-zinc-200 p-2 rounded w-full" placeholder="Enter wallet address" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-200">Amount</label>
              <input type="number" className="border border-zinc-600 bg-zinc-800 text-zinc-200 p-2 rounded w-full" placeholder="Enter amount" />
            </div>
            <Button className="w-full">Send</Button>
          </form>
        </Modal>
      )}

      {activeModal === "receive" && (
        <Modal title="Receive Crypto" onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            {Object.entries(COINS).map(([symbol, meta]) => (
              <div
                key={symbol}
                className="flex items-center justify-between border border-zinc-600 p-2 rounded bg-zinc-800"
              >
                <span className="text-zinc-200">{meta.name}</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-zinc-400">{meta.address}</code>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigator.clipboard.writeText(meta.address)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {activeModal === "buy" && (
        <Modal title="Buy Crypto" onClose={() => setActiveModal(null)}>
          <p className="text-sm text-zinc-400 mb-4">
            This is a demo buy screen. In a real wallet, you’d integrate a payment provider.
          </p>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-200">Select Coin</label>
              <select className="border border-zinc-600 bg-zinc-800 text-zinc-200 p-2 rounded w-full">
                {Object.entries(COINS).map(([symbol, meta]) => (
                  <option key={symbol} value={symbol}>{meta.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-200">Amount in USD</label>
              <input type="number" className="border border-zinc-600 bg-zinc-800 text-zinc-200 p-2 rounded w-full" placeholder="Enter USD amount" />
            </div>
            <Button className="w-full">Buy</Button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Index;
