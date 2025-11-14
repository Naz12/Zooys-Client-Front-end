"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  LineChart, 
  PieChart,
  TrendingUp,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: Array<Record<string, any>>;
  dataKey: string;
  nameKey: string;
  colors?: string[];
  title?: string;
}

interface ChartEditorProps {
  chartData: ChartData;
  onSave: (chartData: ChartData) => void;
  onCancel: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ChartEditor: React.FC<ChartEditorProps> = ({
  chartData,
  onSave,
  onCancel
}) => {
  const [type, setType] = useState<ChartData['type']>(chartData.type || 'bar');
  const [data, setData] = useState<Array<Record<string, any>>>(chartData.data || []);
  const [dataKey, setDataKey] = useState(chartData.dataKey || 'value');
  const [nameKey, setNameKey] = useState(chartData.nameKey || 'name');
  const [title, setTitle] = useState(chartData.title || '');
  const [newRow, setNewRow] = useState({ name: '', value: '' });

  const addDataRow = () => {
    if (newRow.name && newRow.value) {
      setData([...data, { [nameKey]: newRow.name, [dataKey]: Number(newRow.value) }]);
      setNewRow({ name: '', value: '' });
    }
  };

  const removeDataRow = (index: number) => {
    setData(data.filter((_, i) => i !== index));
  };

  const updateDataRow = (index: number, field: string, value: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: field === dataKey ? Number(value) : value };
    setData(newData);
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={dataKey} fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={dataKey} stroke="#0088FE" />
            </RechartsLineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Edit Chart</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Chart Type Selection */}
      <div className="space-y-2">
        <Label>Chart Type</Label>
        <Select value={type} onValueChange={(value) => setType(value as ChartData['type'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Bar Chart
              </div>
            </SelectItem>
            <SelectItem value="line">
              <div className="flex items-center">
                <LineChart className="h-4 w-4 mr-2" />
                Line Chart
              </div>
            </SelectItem>
            <SelectItem value="pie">
              <div className="flex items-center">
                <PieChart className="h-4 w-4 mr-2" />
                Pie Chart
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chart Title */}
      <div className="space-y-2">
        <Label>Chart Title (optional)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter chart title..."
        />
      </div>

      {/* Chart Preview */}
      <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
        {title && <h4 className="text-center font-semibold mb-2">{title}</h4>}
        {data.length > 0 ? renderChart() : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            Add data to see chart preview
          </div>
        )}
      </div>

      {/* Data Editor */}
      <Tabs defaultValue="data" className="w-full">
        <TabsList>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-4">
          <div className="space-y-2">
            <Label>Add New Data Point</Label>
            <div className="flex space-x-2">
              <Input
                value={newRow.name}
                onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
                placeholder="Name"
              />
              <Input
                type="number"
                value={newRow.value}
                onChange={(e) => setNewRow({ ...newRow, value: e.target.value })}
                placeholder="Value"
              />
              <Button onClick={addDataRow} size="sm">
                Add
              </Button>
            </div>
          </div>

          <div className="border border-gray-300 rounded-md overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Value</th>
                  <th className="p-2 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">
                      <Input
                        value={row[nameKey] || ''}
                        onChange={(e) => updateDataRow(index, nameKey, e.target.value)}
                        className="border-0 p-1 h-auto"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={row[dataKey] || ''}
                        onChange={(e) => updateDataRow(index, dataKey, e.target.value)}
                        className="border-0 p-1 h-auto"
                      />
                    </td>
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDataRow(index)}
                      >
                        ×
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-2">
            <Label>Name Key</Label>
            <Input
              value={nameKey}
              onChange={(e) => setNameKey(e.target.value)}
              placeholder="name"
            />
          </div>
          <div className="space-y-2">
            <Label>Data Key</Label>
            <Input
              value={dataKey}
              onChange={(e) => setDataKey(e.target.value)}
              placeholder="value"
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex space-x-2">
        <Button onClick={() => onSave({ type, data, dataKey, nameKey, title })} className="flex-1">
          Save Chart
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ChartEditor;

