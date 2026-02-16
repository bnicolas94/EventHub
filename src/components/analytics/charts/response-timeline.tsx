'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface TimelineData {
    date: string;
    confirmed: number;
    declined: number;
}

interface ResponseTimelineProps {
    data: TimelineData[];
}

export function ResponseTimeline({ data }: ResponseTimelineProps) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                        itemStyle={{ color: '#f1f5f9' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="confirmed"
                        stroke="#8b5cf6"
                        fillOpacity={1}
                        fill="url(#colorConfirmed)"
                        name="Confirmados"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
