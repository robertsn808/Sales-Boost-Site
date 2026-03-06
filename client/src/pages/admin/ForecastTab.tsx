import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, DollarSign, Clock, Target, BarChart3, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";
import type { ForecastData, DealStage } from "./types";
import { DEAL_STAGE_CONFIG } from "./constants";

export default function ForecastTab() {
  const { data: forecast, isLoading } = useQuery<ForecastData>({ queryKey: ["/api/forecast"] });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading forecast...</div>;
  if (!forecast) return <div className="text-center py-12 text-muted-foreground">No data available yet.</div>;

  const f = forecast;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Sales Forecast</h2>
        <p className="text-xs text-muted-foreground mt-1">Pipeline analysis, revenue projections, and win/loss metrics</p>
      </div>

      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Total Pipeline</div>
            <div className="text-lg font-bold">${f.totalPipeline.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Weighted</div>
            <div className="text-lg font-bold text-primary">${Math.round(f.weightedPipeline).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Won</div>
            <div className="text-lg font-bold text-emerald-400">${f.closedWon.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Lost</div>
            <div className="text-lg font-bold text-red-400">${f.closedLost.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Avg Deal</div>
            <div className="text-lg font-bold">${Math.round(f.avgDealSize).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Avg Days</div>
            <div className="text-lg font-bold">{f.avgDaysToClose || "—"}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Win Rate</div>
            <div className="text-lg font-bold">{f.winRate > 0 ? `${f.winRate}%` : "—"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Stage Breakdown */}
        <Card className="border-border/50">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {f.stageBreakdown.map(s => {
                const cfg = DEAL_STAGE_CONFIG[s.stage as DealStage] || DEAL_STAGE_CONFIG.prospecting;
                const pct = f.totalPipeline > 0 ? (s.totalValue / (f.totalPipeline + f.closedWon + f.closedLost)) * 100 : 0;
                return (
                  <div key={s.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${cfg.bg} ${cfg.color}`}>{cfg.label}</Badge>
                        <span className="text-xs text-muted-foreground">{s.count} deals</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium">${s.totalValue.toLocaleString()}</span>
                        {s.avgAge > 0 && <span className="text-[10px] text-muted-foreground ml-2">{s.avgAge}d avg</span>}
                      </div>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Forecast */}
        <Card className="border-border/50">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Monthly Forecast</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {f.monthlyForecast.map((m, i) => {
                const maxVal = Math.max(...f.monthlyForecast.map(x => Math.max(x.projected, x.closed)), 1);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{m.month}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-primary">Projected: ${Math.round(m.projected).toLocaleString()}</span>
                        {m.closed > 0 && <span className="text-emerald-400">Closed: ${m.closed.toLocaleString()}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div className="bg-primary/30 rounded-sm" style={{ width: `${(m.projected / maxVal) * 100}%` }} />
                      {m.closed > 0 && <div className="bg-emerald-400/50 rounded-sm" style={{ width: `${(m.closed / maxVal) * 100}%` }} />}
                    </div>
                  </div>
                );
              })}
            </div>
            {f.monthlyForecast.every(m => m.projected === 0 && m.closed === 0) && (
              <p className="text-xs text-muted-foreground text-center py-4">Add deals with expected close dates to see projections.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Deals */}
      {f.topDeals.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4" /> Top Deals (by weighted value)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {f.topDeals.map((d, i) => {
                const cfg = DEAL_STAGE_CONFIG[d.stage as DealStage] || DEAL_STAGE_CONFIG.prospecting;
                return (
                  <div key={d.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{d.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${cfg.bg} ${cfg.color}`}>{cfg.label}</Badge>
                          {d.expectedCloseDate && <span className="text-[10px] text-muted-foreground">Close: {d.expectedCloseDate}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="text-sm font-bold">${d.value.toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground">{d.probability}% → ${Math.round(d.weightedValue || d.value * d.probability / 100).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
