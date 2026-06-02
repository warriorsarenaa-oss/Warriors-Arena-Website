"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { WAPanel } from "@/components/UI/WAPanel";
import { DollarSign, Target, CalendarDays, Activity, AlertTriangle } from "lucide-react";

type Period = "today" | "week" | "month" | "custom";

export default function RevenuePage() {
  const [period, setPeriod] = useState<Period>("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/api/v1/admin/revenue?period=${period}`;
      if (period === 'custom' && fromDate && toDate) {
        url += `&from=${fromDate}&to=${toDate}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    setPeriod("custom");
    fetchData();
  };

  const COLORS = ['#39FF14', '#007FFF', '#FF4500', '#FFD700', '#FF1493', '#8A2BE2'];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading uppercase tracking-widest text-wa-green mb-2">
            REVENUE INTELLIGENCE
          </h1>
          <p className="text-wa-text/60 uppercase text-xs tracking-wider">
            Financial metrics and operational breakdown
          </p>
        </div>

        <div className="flex gap-2 bg-wa-bg/50 border border-wa-green/20 p-1 rounded">
          {["today", "week", "month", "custom"].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p as Period)}
              className={`px-4 py-2 rounded text-xs uppercase tracking-widest font-bold transition-colors ${
                period === p ? 'bg-wa-green text-wa-bg' : 'text-wa-text hover:bg-wa-green/10'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {period === 'custom' && (
        <form onSubmit={handleCustomRange} className="flex gap-4 items-end bg-wa-bg/50 p-4 border border-wa-green/20 rounded">
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase opacity-70">From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-transparent border border-wa-green/20 p-2 rounded text-sm" required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase opacity-70">To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-transparent border border-wa-green/20 p-2 rounded text-sm" required />
          </div>
          <button type="submit" className="bg-wa-green/20 text-wa-green hover:bg-wa-green/30 border border-wa-green px-4 py-2 rounded text-xs uppercase font-bold tracking-widest h-[38px]">
            APPLY FILTER
          </button>
        </form>
      )}

      {loading || !data ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-wa-green border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <WAPanel className="p-6 border-wa-green/50 bg-wa-bg/50">
              <h3 className="text-xs uppercase tracking-widest opacity-60 mb-2">Total Revenue (Collected)</h3>
              <p className="text-4xl font-bold text-wa-green">{data.realized_revenue.toLocaleString()} <span className="text-2xl">EGP</span></p>
            </WAPanel>
            <WAPanel className="p-6 border-wa-green/30 bg-wa-bg/50">
              <h3 className="text-xs uppercase tracking-widest opacity-60 mb-2">Sessions Completed</h3>
              <p className="text-4xl font-bold text-wa-text">{data.games_played}</p>
            </WAPanel>
            <WAPanel className="p-6 border-wa-orange/30 bg-wa-bg/50">
              <h3 className="text-xs uppercase tracking-widest opacity-60 mb-2 text-wa-orange">Cancellation Rate</h3>
              <p className="text-4xl font-bold text-wa-orange">{data.cancellation_rate.toFixed(1)}%</p>
            </WAPanel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <WAPanel className="p-6 border-wa-green/20 bg-wa-bg/50 lg:col-span-2">
              <h3 className="text-xs uppercase tracking-widest font-bold mb-6 text-wa-green">Revenue Timeline</h3>
              <div className="h-72 min-h-[300px] w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.slot_breakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                    <XAxis dataKey="slot_time" stroke="#666" tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                    <YAxis stroke="#666" tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      cursor={{fill: '#1a1a1a'}} 
                      contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '8px'}}
                      itemStyle={{padding: '2px 0'}}
                    />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Bar name="Games Completed" dataKey="completed_revenue" stackId="a" fill="#39FF14" radius={[0, 0, 0, 0]} />
                    <Bar name="Unrefunded Deposits" dataKey="penalty_revenue" stackId="a" fill="#444444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </WAPanel>

            {/* Cancel Reasons */}
            <WAPanel className="p-6 border-wa-error/20 bg-wa-bg/50">
              <h3 className="text-xs uppercase tracking-widest font-bold mb-6 text-wa-error">Cancellation Breakdown</h3>
              <div className="h-64 min-h-[250px] w-full text-xs">
                {data.cancellation_breakdown.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-wa-text/40 italic">No cancellations</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.cancellation_breakdown}
                        dataKey="count"
                        nameKey="reason"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        {data.cancellation_breakdown.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #ff4500'}} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </WAPanel>
          </div>

          {/* Game Breakdown Table */}
          <WAPanel className="p-0 overflow-hidden border-wa-green/20 bg-wa-bg/50">
            <div className="p-4 border-b border-wa-green/20">
              <h3 className="text-xs uppercase tracking-widest font-bold text-wa-green">Game Performance Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-wa-green/20 text-wa-text/60 uppercase tracking-widest text-[10px]">
                    <th className="p-4">Game</th>
                    <th className="p-4">Confirmed</th>
                    <th className="p-4">Completed</th>
                    <th className="p-4">Cancelled</th>
                    <th className="p-4">Total Revenue</th>
                    <th className="p-4">Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {data.game_breakdown.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center italic opacity-50">No data available</td></tr>
                  ) : data.game_breakdown.map((game: any) => (
                    <tr key={game.game_name} className="border-b border-wa-green/10 hover:bg-wa-green/5 transition-colors">
                      <td className="p-4 font-bold">{game.game_name}</td>
                      <td className="p-4">{game.confirmed}</td>
                      <td className="p-4">{game.completed}</td>
                      <td className="p-4 text-wa-orange">{game.cancelled}</td>
                      <td className="p-4 text-wa-green">{game.total_revenue.toLocaleString()} EGP</td>
                      <td className="p-4">{game.completed > 0 ? Math.round(game.total_revenue / game.completed).toLocaleString() : 0} EGP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WAPanel>
        </>
      )}
    </div>
  );
}
