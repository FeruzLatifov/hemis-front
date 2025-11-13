import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

export interface FilterProperty {
  key: string;
  label: string;
  type: 'text' | 'select' | 'boolean';
  options?: { value: string; label: string }[];
}

export interface FilterCondition {
  id: string;
  property: string;
  operator: string;
  value: string;
}

interface AdvancedFilterProps {
  properties: FilterProperty[];
  onApply: (conditions: FilterCondition[]) => void;
  onClear: () => void;
}

const OPERATORS = {
  text: [
    { value: 'contains', label: 'contains' },
    { value: 'equals', label: 'equals' },
    { value: 'startsWith', label: 'starts with' },
    { value: 'endsWith', label: 'ends with' },
    { value: 'notContains', label: 'does not contain' },
  ],
  select: [
    { value: 'equals', label: 'equals' },
    { value: 'notEquals', label: 'not equals' },
  ],
  boolean: [
    { value: 'equals', label: 'is' },
  ],
};

export default function AdvancedFilter({ properties, onApply, onClear }: AdvancedFilterProps) {
  const { t } = useTranslation();
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');

  const addCondition = () => {
    if (!selectedProperty) return;

    const property = properties.find((p) => p.key === selectedProperty);
    if (!property) return;

    const defaultOperator = OPERATORS[property.type][0].value;

    const newCondition: FilterCondition = {
      id: `${Date.now()}-${Math.random()}`,
      property: selectedProperty,
      operator: defaultOperator,
      value: '',
    };

    setConditions([...conditions, newCondition]);
    setSelectedProperty('');
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, field: keyof FilterCondition, value: string) => {
    setConditions(
      conditions.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  const handleApply = () => {
    const validConditions = conditions.filter((c) => c.value.trim() !== '');
    onApply(validConditions);
  };

  const handleClear = () => {
    setConditions([]);
    onClear();
  };

  const getPropertyLabel = (key: string) => {
    return properties.find((p) => p.key === key)?.label || key;
  };

  const getPropertyType = (key: string) => {
    return properties.find((p) => p.key === key)?.type || 'text';
  };

  const getPropertyOptions = (key: string) => {
    return properties.find((p) => p.key === key)?.options || [];
  };

  return (
    <Card className="p-3 space-y-3 bg-white border">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="font-medium text-sm">Shart qo'shish</h3>
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            disabled={conditions.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
            Tozalash
          </button>
          <button
            onClick={handleApply}
            disabled={conditions.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Qo'llash
          </button>
        </div>
      </div>

      {/* Add Condition */}
      <div className="flex gap-2">
        <select
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Xususiyat tanlang...</option>
          {properties.map((prop) => (
            <option key={prop.key} value={prop.key}>
              {prop.label}
            </option>
          ))}
        </select>
        <button
          onClick={addCondition}
          disabled={!selectedProperty}
          className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Shart qo'shish
        </button>
      </div>

      {/* Active Conditions */}
      {conditions.length > 0 && (
        <div className="space-y-2">
          {conditions.map((condition) => {
            const propertyType = getPropertyType(condition.property);
            const operators = OPERATORS[propertyType];
            const options = getPropertyOptions(condition.property);

            return (
              <div
                key={condition.id}
                className="flex gap-2 items-end p-2 bg-gray-50 rounded border"
              >
                {/* Property Name */}
                <div className="flex-none w-40">
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Xususiyat
                  </label>
                  <div className="font-medium text-sm px-2 py-1.5 bg-white border rounded">
                    {getPropertyLabel(condition.property)}
                  </div>
                </div>

                {/* Operator */}
                <div className="flex-none w-36">
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Operator
                  </label>
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {operators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Qiymat
                  </label>
                  {propertyType === 'select' ? (
                    <select
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tanlang...</option>
                      {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : propertyType === 'boolean' ? (
                    <select
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tanlang...</option>
                      <option value="true">Ha</option>
                      <option value="false">Yo'q</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) =>
                        updateCondition(condition.id, 'value', e.target.value)
                      }
                      placeholder="Qiymat kiriting..."
                      className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeCondition(condition.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                  title="O'chirish"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {conditions.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          <p>Hech qanday filtr qo'llanmagan</p>
        </div>
      )}
    </Card>
  );
}

