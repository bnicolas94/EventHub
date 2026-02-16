'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface DietaryStat {
    name: string;
    value: number;
    fill: string;
}

interface DietaryStatsProps {
    data: DietaryStat[];
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export function DietaryStats({ data }: DietaryStatsProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center text-slate-500">
                No hay datos de preferencias alimenticias aún.
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(0,0,0,0.5)" />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                        itemStyle={{ color: '#f1f5f9' }}
                    />
                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
