// app/(dashboard)/dashboard/page.tsx
"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

interface KpiData { total_docs: number; total_invoices: number; total_value: number; }
interface ChartData { doc_distribution: Record<string, number>; top_vendors: Record<string, number>; }

const COLORS = ['#1976d2', '#00C49F', '#FFBB28', '#FF8042'];

// Formatter for tooltips and axis
const valueFormatter = (value: number) => `₹${value.toLocaleString('en-IN')}`;
const shortValueFormatter = (value: number) => `₹${(value / 1000).toFixed(0)}k`;

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8000/dashboard-data/');
        setKpis(response.data.kpis);
        setCharts(response.data.charts);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
    // Auto-refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  const pieData = charts ? Object.entries(charts.doc_distribution).map(([name, value]) => ({ name, value })) : [];
  // Sort bar data from highest to lowest for horizontal chart
  const barData = charts ? Object.entries(charts.top_vendors)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.value - b.value) : [];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>Analytics Dashboard</Typography>
      <Grid container spacing={3}>
        {/* KPIs */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" color="textSecondary">Total Documents</Typography>
            <Typography variant="h3" sx={{ fontWeight: 600 }}>{kpis?.total_docs || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" color="textSecondary">Total Invoices</Typography>
            <Typography variant="h3" sx={{ fontWeight: 600 }}>{kpis?.total_invoices || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" color="textSecondary">Total Value</Typography>
            <Typography variant="h3" sx={{ fontWeight: 600 }}>₹{kpis?.total_value.toLocaleString('en-IN') || 0}</Typography>
          </Paper>
        </Grid>

        {/* --- UI FIX: Horizontal Bar Chart --- */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 400, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Top Vendors by Value</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={shortValueFormatter} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={valueFormatter} />
                <Legend />
                <Bar dataKey="value" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 400, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Document Distribution</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}