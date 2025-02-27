```
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Receipt, Wallet, Plus, X } from 'lucide-react';

const ExpenseInputForm = () => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => currentYear - 2 + i);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState('january');

  const [operationalExpenses, setOperationalExpenses] = useState([
    { label: 'Electricity', amount: '' }
  ]);

  const [capitalExpenses, setCapitalExpenses] = useState([
    { label: 'Repairs', amount: '' }
  ]);

  const months = [
    'january', 'february', 'march', 'april',
    'may', 'june', 'july', 'august',
    'september', 'october', 'november', 'december'
  ];

  const handleExpenseChange = (index, field, value, type) => {
    if (type === 'operational') {
      const newExpenses = [...operationalExpenses];
      newExpenses[index] = { ...newExpenses[index], [field]: value };
      setOperationalExpenses(newExpenses);
    } else {
      const newExpenses = [...capitalExpenses];
      newExpenses[index] = { ...newExpenses[index], [field]: value };
      setCapitalExpenses(newExpenses);
    }
  };

  const addExpense = (type) => {
    if (type === 'operational') {
      setOperationalExpenses([...operationalExpenses, { label: '', amount: '' }]);
    } else {
      setCapitalExpenses([...capitalExpenses, { label: '', amount: '' }]);
    }
  };

  const removeExpense = (index, type) => {
    if (type === 'operational') {
      setOperationalExpenses(operationalExpenses.filter((_, i) => i !== index));
    } else {
      setCapitalExpenses(capitalExpenses.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      year: selectedYear,
      month: selectedMonth,
      operationalExpenses,
      capitalExpenses
    };
    console.log('Form submitted:', formData);
  };

  const ExpenseInputs = ({ expenses, type }) => (
    <div className="space-y-4">
      {expenses.map((expense, index) => (
        <div key={index} className="flex gap-4 items-center">
          <Input
            value={expense.label}
            onChange={(e) => handleExpenseChange(index, 'label', e.target.value, type)}
            placeholder="Expense Label"
            className="bg-white w-64"
          />
          <div className="relative w-48">
            <span className="absolute left-3 top-2 text-gray-500">₱</span>
            <Input
              type="number"
              value={expense.amount}
              onChange={(e) => handleExpenseChange(index, 'amount', e.target.value, type)}
              className="pl-8 bg-white"
              placeholder="0.00"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeExpense(index, type)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Expense Entry</h1>
          <div className="flex gap-4 justify-center items-center">
            <div className="w-32">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="text-lg bg-white border-2 hover:bg-gray-50">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="text-lg">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="text-lg bg-white border-2 hover:bg-gray-50">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month} className="text-lg">
                      {month.charAt(0).toUpperCase() + month.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operational Expenses */}
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <Receipt className="h-5 w-5" />
                  Operational Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <div className="space-y-6">
                  <ExpenseInputs expenses={operationalExpenses} type="operational" />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => addExpense('operational')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Operational Expense
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Capital Expenses */}
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="flex items-center gap-2 text-gray-700">
                  <Wallet className="h-5 w-5" />
                  Capital Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <div className="space-y-6">
                  <ExpenseInputs expenses={capitalExpenses} type="capital" />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => addExpense('capital')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Capital Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            >
              Save Expenses
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseInputForm;
```