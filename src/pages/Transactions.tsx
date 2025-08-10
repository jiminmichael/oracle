import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import btcLogo from "@/assets/coins/btc.png";

interface Tx {
  id: string;
  type: "send" | "receive";
  amount: number;
  counterparty: string;
  timestamp: number;
}

function randomAddress() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return (
    "bc1" +
    Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") +
    "..." +
    Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  );
}

function generateTransactions(): Tx[] {
  const startDate = new Date("2025-03-01T00:00:00Z");
  const now = new Date();
  const txs: Tx[] = [];
  let idCount = 1;

  for (
    let d = new Date(startDate);
    d <= now;
    d.setDate(d.getDate() + 1)
  ) {
    // Generate at least 3 incoming tx per day
    const numTx = Math.floor(Math.random() * 3) + 3; // 3–5 per day
    let receiveCount = 0;

    for (let i = 0; i < numTx; i++) {
      const isReceive = receiveCount < 3 ? true : Math.random() > 0.5;
      if (isReceive) receiveCount++;

      // random time within the day
      const txTime = new Date(d);
      txTime.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      txs.push({
        id: `tx${idCount++}`,
        type: isReceive ? "receive" : "send",
        amount: Number((Math.random() * 0.005 + 0.0005).toFixed(4)), // small BTC amounts
        counterparty: randomAddress(),
        timestamp: txTime.getTime(),
      });
    }
  }

  return txs.sort((a, b) => b.timestamp - a.timestamp); // newest first
}

const Transactions = () => {
  const [btcTxs, setBtcTxs] = useState<Tx[]>([]);

  useEffect(() => {
    document.title = "Bitcoin Transaction History – Mobile Coin Vault";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Full BTC transaction history since March 2025 with live USD values."
      );
    }

    const stored = localStorage.getItem("btcTxs");
    if (stored) {
      setBtcTxs(JSON.parse(stored));
    } else {
      const generated = generateTransactions();
      setBtcTxs(generated);
      localStorage.setItem("btcTxs", JSON.stringify(generated));
    }
  }, []);

  const { data } = useQuery({
    queryKey: ["price-btc"],
    queryFn: async () => {
      const res = await fetch("https://api.coincap.io/v2/assets?ids=bitcoin");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      return Number(json?.data?.[0]?.priceUsd ?? 0);
    },
    refetchInterval: 60000,
  });

  const price = data ?? 0;

  return (
    <div className="dark min-h-screen bg-background pb-6">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="container py-4 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground shrink-0" aria-label="Back to wallet">
            <ChevronLeft className="size-5" />
          </Link>
          <div className="flex items-center gap-3">
            <img src={btcLogo} alt="Bitcoin (BTC) logo" className="size-9 rounded-full" />
            <div>
              <h1 className="text-xl font-semibold">Bitcoin Transaction History</h1>
              <p className="text-sm text-muted-foreground">Since March 2025</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container pt-4 space-y-3">
        <Card className="divide-y">
          {btcTxs.map((tx) => {
            const isReceive = tx.type === "receive";
            const fiat = price > 0 ? tx.amount * price : 0;
            return (
              <article key={tx.id} className="flex items-center gap-3 p-4">
                <div className="size-10 rounded-full grid place-items-center bg-secondary">
                  {isReceive ? (
                    <ArrowDownLeft className="size-5 text-primary" aria-hidden />
                  ) : (
                    <ArrowUpRight className="size-5 text-destructive" aria-hidden />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{isReceive ? "Received" : "Sent"} BTC</p>
                    <p
                      className={`font-semibold ${
                        isReceive ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {isReceive ? "+" : "-"}
                      {tx.amount} BTC
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {isReceive ? "from" : "to"} {tx.counterparty}
                    </span>
                    <span>
                      {price > 0
                        ? `$${fiat.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}`
                        : "~"}{" "}
                      • {format(new Date(tx.timestamp), "PP p")} (
                      {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })})
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </Card>
      </main>
    </div>
  );
};

export default Transactions;
