"use client"

import { useEffect, useState } from "react"
import { Loader2, Trophy, Medal, BarChart3 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { votes as votesActions } from "@/app/actions/index"
import type { User } from "@/types"

const VALUE_COLORS: Record<string, string> = {
  "THINK DIFFERENT AND LOOK TO THE HORIZON": "#6366f1",
  "LEARN, TEACH, REPEAT": "#8b5cf6",
  "WALK THE TALK": "#06b6d4",
  "EXECUTE, FAIL FAST, FAIL DIFFERENTLY": "#f59e0b",
  "WE ENJOY WHAT WE DO": "#22c55e",
  "CUSTOMER FIRST": "#ef4444",
}

const VALUE_SHORT_LABELS: Record<string, string> = {
  "THINK DIFFERENT AND LOOK TO THE HORIZON": "Think Different",
  "LEARN, TEACH, REPEAT": "Learn, Teach",
  "WALK THE TALK": "Walk the Talk",
  "EXECUTE, FAIL FAST, FAIL DIFFERENTLY": "Fail Fast",
  "WE ENJOY WHAT WE DO": "Enjoy",
  "CUSTOMER FIRST": "Customer First",
}

interface AnalyticsData {
  valueDistribution: { value: string; count: number }[]
  peopleRanking: { user: User; totalVotes: number }[]
}

const medalIcons = [
  { Icon: Trophy, color: "text-yellow-500" },
  { Icon: Medal, color: "text-gray-400" },
  { Icon: Medal, color: "text-amber-600" },
]

export function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: result } = await votesActions.getAnalyticsData()
      if (result) setData(result)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!data || (data.valueDistribution.length === 0 && data.peopleRanking.length === 0)) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No voting data available yet.
      </div>
    )
  }

  const chartData = data.valueDistribution.map((item) => ({
    name: VALUE_SHORT_LABELS[item.value] || item.value,
    fullName: item.value,
    votes: item.count,
  }))

  const totalVotes = data.valueDistribution.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Company Values Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="name"
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 12 }}
                  height={60}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const item = payload[0].payload
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium">{item.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.votes} vote{item.votes !== 1 ? "s" : ""} ({Math.round((item.votes / totalVotes) * 100)}%)
                        </p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={VALUE_COLORS[entry.fullName] || "#8884d8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
            {data.valueDistribution.map((item) => (
              <div
                key={item.value}
                className="flex items-center gap-2 p-2 rounded-md border"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: VALUE_COLORS[item.value] || "#8884d8" }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{VALUE_SHORT_LABELS[item.value] || item.value}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.count} ({Math.round((item.count / totalVotes) * 100)}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            All-Time People Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.peopleRanking.map((entry, index) => {
              const medal = medalIcons[index]
              return (
                <div
                  key={entry.user.id}
                  className="flex items-center gap-4 p-3 rounded-lg border transition-colors"
                >
                  <div className="w-8 text-center font-bold text-lg text-muted-foreground">
                    {medal ? (
                      <medal.Icon className={`h-6 w-6 mx-auto ${medal.color}`} />
                    ) : (
                      <span>#{index + 1}</span>
                    )}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.user.avatar_url} alt={entry.user.name} />
                    <AvatarFallback>{entry.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{entry.user.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{entry.totalVotes}</p>
                    <p className="text-xs text-muted-foreground">
                      vote{entry.totalVotes !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
