```
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, ChevronDown, ChevronUp, PencilLine } from 'lucide-react';

const BudgetPlanner = () => {
  // Initial demo project
  const initialProject = {
    id: 1,
    name: 'Kitchen Renovation',
    budget: '150000',
    category: 'Renovation',
    status: 'ongoing',
    items: [
      {
        id: 1,
        name: 'Cabinets',
        type: 'Materials',
        cost: '45000',
        quantity: '1'
      }
    ],
    isExpanded: true,
    isEditingBudget: false
  };

  const [projects, setProjects] = useState([initialProject]);
  const [stats, setStats] = useState({
    totalBudget: 150000,
    allocatedBudget: 45000,
    remainingBudget: 105000,
    completedProjects: 0,
    ongoingProjects: 1
  });

  const categories = [
    "Renovation", "Repairs", "Maintenance", "Furniture", "Appliances",
    "Utilities", "Security", "Landscaping", "Paint", "Plumbing",
    "Electrical", "HVAC", "Other"
  ];

  const itemTypes = [
    "Materials", "Labor", "Equipment Rental", "Permits", "Inspection",
    "Professional Services", "Other"
  ];

  const calculateProjectTotal = (items) => {
    return items.reduce((sum, item) => 
      sum + ((parseFloat(item.cost) || 0) * (parseFloat(item.quantity) || 1)), 0
    );
  };

  const updateStats = (updatedProjects) => {
    const newStats = {
      totalBudget: 0,
      allocatedBudget: 0,
      remainingBudget: 0,
      completedProjects: 0,
      ongoingProjects: 0
    };

    updatedProjects.forEach(project => {
      const projectBudget = parseFloat(project.budget) || 0;
      const itemsTotal = calculateProjectTotal(project.items);

      newStats.totalBudget += projectBudget;
      newStats.allocatedBudget += itemsTotal;
      
      if (project.status === 'completed') {
        newStats.completedProjects += 1;
      } else if (project.status === 'ongoing') {
        newStats.ongoingProjects += 1;
      }
    });

    newStats.remainingBudget = newStats.totalBudget - newStats.allocatedBudget;
    setStats(newStats);
  };

  useEffect(() => {
    updateStats(projects);
  }, [projects]);

  const addProject = () => {
    setProjects(prev => [...prev, {
      id: prev.length + 1,
      name: '',
      budget: '',
      category: '',
      status: 'planned',
      items: [],
      isExpanded: true,
      isEditingBudget: false
    }]);
  };

  const removeProject = (id) => {
    setProjects(prev => prev.filter(project => project.id !== id));
  };

  const updateProject = (id, field, value) => {
    setProjects(prev => prev.map(project => 
      project.id === id ? { ...project, [field]: value } : project
    ));
  };

  const addItem = (projectId) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? {
            ...project,
            items: [...project.items, {
              id: project.items.length + 1,
              name: '',
              type: '',
              cost: '',
              quantity: '1'
            }]
          }
        : project
    ));
  };

  const updateItem = (projectId, itemId, field, value) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId
        ? {
            ...project,
            items: project.items.map(item =>
              item.id === itemId ? { ...item, [field]: value } : item
            )
          }
        : project
    ));
  };

  const removeItem = (projectId, itemId) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId
        ? {
            ...project,
            items: project.items.filter(item => item.id !== itemId)
          }
        : project
    ));
  };

  const toggleProjectExpansion = (projectId) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId
        ? { ...project, isExpanded: !project.isExpanded }
        : project
    ));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{stats.totalBudget.toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Allocated / Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-lg font-semibold">
                ₱{stats.allocatedBudget.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              <div className="text-sm text-gray-500">
                Remaining: ₱{stats.remainingBudget.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-lg font-semibold">
                {stats.completedProjects} Completed
              </div>
              <div className="text-sm text-gray-500">
                {stats.ongoingProjects} Ongoing
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Projects</CardTitle>
          <CardDescription>Manage your property renovation and maintenance projects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {projects.map((project) => {
            const projectTotal = calculateProjectTotal(project.items);
            const budgetDifference = (parseFloat(project.budget) || 0) - projectTotal;
            
            return (
              <Card key={project.id} className="border border-gray-200">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleProjectExpansion(project.id)}
                        className="mt-2"
                      >
                        {project.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>

                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <Input
                              placeholder="Project Name"
                              value={project.name}
                              onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                              className="text-lg"
                            />
                          </div>
                          <div className="text-right ml-4">
                            <div className="flex items-center justify-end gap-2">
                              {project.isEditingBudget ? (
                                <Input
                                  type="number"
                                  value={project.budget}
                                  onChange={(e) => updateProject(project.id, 'budget', e.target.value)}
                                  onBlur={() => updateProject(project.id, 'isEditingBudget', false)}
                                  autoFocus
                                  className="w-32 text-right"
                                />
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => updateProject(project.id, 'isEditingBudget', true)}
                                    className="h-6 w-6"
                                  >
                                    <PencilLine className="h-4 w-4" />
                                  </Button>
                                  <span className="text-lg font-semibold">
                                    Budget: ₱{(parseFloat(project.budget) || 0).toLocaleString('en-PH', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              Allocated: ₱{projectTotal.toLocaleString('en-PH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </div>
                            <div className={`text-sm ${budgetDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {budgetDifference >= 0 ? 'Under' : 'Over'} budget by ₱{Math.abs(budgetDifference).toLocaleString('en-PH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Select
                            value={project.category}
                            onValueChange={(value) => updateProject(project.id, 'category', value)}
                          >
                            <SelectTrigger className="w-1/2">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={project.status}
                            onValueChange={(value) => updateProject(project.id, 'status', value)}
                          >
                            <SelectTrigger className="w-1/2">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planned">Planned</SelectItem>
                              <SelectItem value="ongoing">Ongoing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProject(project.id)}
                        className="mt-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {project.isExpanded && (
                      <div className="pl-10 space-y-4">
                        {project.items.map((item) => (
                          <div key={item.id} className="flex gap-4 items-start">
                            <div className="flex-1 space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Item Name"
                                  value={item.name}
                                  onChange={(e) => updateItem(project.id, item.id, 'name', e.target.value)}
                                  className="w-1/3"
                                />
                                <Select 
                                  value={item.type}
                                  onValueChange={(value) => updateItem(project.id, item.id, 'type', value)}
                                >
                                  <SelectTrigger className="w-1/4">
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {itemTypes.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  placeholder="Cost"
                                  value={item.cost}
                                  onChange={(e) => updateItem(project.id, item.id, 'cost', e.target.value)}
                                  className="w-1/4"
                                />
                                <Input
                                  type="number"
                                  placeholder="Qty"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(project.id, item.id, 'quantity', e.target.value)}
                                  className="w-1/6"
                                />
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(project.id, item.id)}
                              className="mt-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => addItem(project.id)}
                          size="sm"
                          className="ml-2"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          <Button
            variant="outline"
            onClick={addProject}
            className="w-full mt-4"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetPlanner;
```