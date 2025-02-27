
```
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Receipt, PiggyBank, Wallet } from 'lucide-react';

const RentCollectionDashboard = () => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => currentYear - 2 + i);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState('january');

  const rentData = {
    january: {
      floorData: {
        secondFloor: {
          income: 36000,
          note: ''
        },
        thirdFloor: {
          income: 48500,
          note: 'Room 2 - ₱29,500 (6 months full payment)'
        }
      },
      operationalExpenses: {
        electricity: 3000,
        water: 3000,
        janitorialSupplies: 1000,
        internet: 1700,
        janitorialService: 4000
      },
      capitalExpenses: {
        repairs: 5000,
        cctvInstallation: 5000,
        airconDownpayment: 5000
      },
      profitSharing: {
        forty: 28720,
        sixty: 43080
      },
      totals: {
        grossIncome: 84500,
        operationalExpenses: 12700,
        netBeforeCapEx: 71800,
        capitalExpenses: 15000,
        finalNet: 28080
      }
    }
  };

  const months = [
    'january', 'february', 'march', 'april',
    'may', 'june', 'july', 'august',
    'september', 'october', 'november', 'december'
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const currentData = rentData[selectedMonth] || rentData.january;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Monthly Rent Collection</h1>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gross Income Section */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <Building2 className="h-5 w-5" />
                Gross Monthly Income
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {['secondFloor', 'thirdFloor'].map((floor) => (
                  <div key={floor} className="bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="font-semibold text-lg text-gray-800 mb-3">
                      {floor === 'secondFloor' ? '2nd Floor' : '3rd Floor'} Rent
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg text-gray-900">
                          {formatCurrency(currentData.floorData[floor].income)}
                        </span>
                      </div>
                      {currentData.floorData[floor].note && (
                        <div className="text-sm text-gray-600 italic">
                          Note: {currentData.floorData[floor].note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t-2 flex justify-between items-center">
                  <span className="font-semibold text-lg">Total Gross Income</span>
                  <span className="font-bold text-xl text-gray-900">
                    {formatCurrency(currentData.totals.grossIncome)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operational Expenses */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <Receipt className="h-5 w-5" />
                Operational Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {Object.entries(currentData.operationalExpenses).map(([key, amount]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-gray-600">
                      {key.replace(/([A-Z])/g, ' $1').split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </span>
                    <span className="font-semibold text-gray-900">{formatCurrency(amount)}</span>
                  </div>
                ))}
                <div className="pt-4 mt-4 border-t-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-medium">Total Operational Expenses</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(currentData.totals.operationalExpenses)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capital Expenses */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <Wallet className="h-5 w-5" />
                Capital Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {Object.entries(currentData.capitalExpenses).map(([key, amount]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-gray-600">
                      {key.replace(/([A-Z])/g, ' $1').split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </span>
                    <span className="font-semibold text-gray-900">{formatCurrency(amount)}</span>
                  </div>
                ))}
                <div className="pt-4 mt-4 border-t-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-medium">Total Capital Expenses</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(currentData.totals.capitalExpenses)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Final Summary */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <PiggyBank className="h-5 w-5" />
                Profit Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Net Before Capital Expenses</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(currentData.totals.netBeforeCapEx)}
                  </span>
                </div>
                <div className="pl-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">40% Share</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(currentData.profitSharing.forty)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">60% Share</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(currentData.profitSharing.sixty)}
                    </span>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-medium">Final Net (After CapEx)</span>
                    <span className="font-bold text-xl text-green-600">
                      {formatCurrency(currentData.totals.finalNet)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RentCollectionDashboard;
```