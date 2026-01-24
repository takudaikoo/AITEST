"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface RecentActivityChartProps {
    data: { name: string; total: number }[];
}

export function RecentActivityChart({ data }: RecentActivityChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px' }}
                />
                <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} className="fill-primary" />
            </BarChart>
        </ResponsiveContainer>
    );
}
