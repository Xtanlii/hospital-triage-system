import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export const TriageDistributionDonut = ({ data }) => {
  const { isDarkMode } = useTheme();

  const tooltipStyle = {
    borderRadius: '12px',
    border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
    fontSize: '12px',
    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    color: isDarkMode ? '#f8fafc' : '#0f172a',
    boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 4px 6px -1px rgba(0,0,0,0.05)'
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip 
            formatter={(value, name) => [`${value} Patients`, name]}
            contentStyle={tooltipStyle}
            itemStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            formatter={(value) => <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DepartmentWaitBarChart = ({ data }) => {
  const { isDarkMode } = useTheme();

  const tooltipStyle = {
    borderRadius: '12px',
    border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
    fontSize: '12px',
    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    color: isDarkMode ? '#f8fafc' : '#0f172a',
    boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 4px 6px -1px rgba(0,0,0,0.05)'
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b' }} 
            axisLine={{ stroke: isDarkMode ? '#334155' : '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b' }} 
            axisLine={false}
            tickLine={false}
            unit="m"
          />
          <RechartsTooltip 
            formatter={(val, name, item) => [`${val} mins (${item.payload.queue} in queue)`, item.payload.fullName]}
            contentStyle={tooltipStyle}
            itemStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
          />
          <Bar 
            dataKey="avgWait" 
            name="Avg Wait Time (min)" 
            fill="#0284C7" 
            radius={[6, 6, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PatientFlowLineChart = ({ data }) => {
  const { isDarkMode } = useTheme();

  const tooltipStyle = {
    borderRadius: '12px',
    border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
    fontSize: '12px',
    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    color: isDarkMode ? '#f8fafc' : '#0f172a',
    boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 4px 6px -1px rgba(0,0,0,0.05)'
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0284C7" stopOpacity={isDarkMode ? 0.35 : 0.2}/>
              <stop offset="95%" stopColor="#0284C7" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={isDarkMode ? 0.35 : 0.2}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
          <XAxis 
            dataKey="hour" 
            tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b' }} 
            axisLine={{ stroke: isDarkMode ? '#334155' : '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b' }} 
            axisLine={false}
            tickLine={false}
          />
          <RechartsTooltip 
            contentStyle={tooltipStyle}
            itemStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
          />
          <Legend 
            verticalAlign="top" 
            align="right"
            height={30} 
            formatter={(value) => <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{value}</span>}
          />
          <Area 
            type="monotone" 
            dataKey="arrivals" 
            name="Intake Arrivals" 
            stroke="#0284C7" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorArrivals)" 
          />
          <Area 
            type="monotone" 
            dataKey="completed" 
            name="Doctor Completed" 
            stroke="#10B981" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorCompleted)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
