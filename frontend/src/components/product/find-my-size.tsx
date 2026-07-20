'use client';

import { useState } from 'react';
import { Ruler, X, ChevronDown, Sparkles } from 'lucide-react';

const sizeChart = [
  { size: 'XS', chestMin: 32, chestMax: 34, waistMin: 26, waistMax: 28 },
  { size: 'S', chestMin: 34, chestMax: 36, waistMin: 28, waistMax: 30 },
  { size: 'M', chestMin: 36, chestMax: 38, waistMin: 30, waistMax: 32 },
  { size: 'L', chestMin: 38, chestMax: 40, waistMin: 32, waistMax: 34 },
  { size: 'XL', chestMin: 40, chestMax: 42, waistMin: 34, waistMax: 36 },
  { size: 'XXL', chestMin: 42, chestMax: 44, waistMin: 36, waistMax: 38 },
  { size: '3XL', chestMin: 44, chestMax: 46, waistMin: 38, waistMax: 40 },
];

interface FindMySizeProps {
  availableSizes: string[];
  onSelectSize?: (size: string) => void;
}

export function FindMySize({ availableSizes, onSelectSize }: FindMySizeProps) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [recommended, setRecommended] = useState<string | null>(null);

  const suggestSize = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w) return;
    const bmi = w / ((h / 100) ** 2);
    let idx = 2;
    if (bmi < 18.5) idx = 1;
    else if (bmi < 22) idx = 2;
    else if (bmi < 25) idx = 3;
    else if (bmi < 28) idx = 4;
    else if (bmi < 31) idx = 5;
    else idx = 6;
    if (h < 160) idx = Math.max(0, idx - 1);
    if (h > 180) idx = Math.min(sizeChart.length - 1, idx + 1);
    const suggestion = sizeChart[Math.min(idx, sizeChart.length - 1)].size;
    setRecommended(suggestion);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Ruler size={18} className="text-[#d4a853]" />
          <span className="text-sm font-semibold text-gray-900">Find My Size</span>
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-5 border-t border-gray-100 animate-fadeIn">
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Height (cm)</label>
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Weight (kg)</label>
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Age</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Body Type</label>
              <select value={bodyType} onChange={(e) => setBodyType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black transition-colors bg-white">
                <option value="">Select</option>
                <option value="slim">Slim</option>
                <option value="athletic">Athletic</option>
                <option value="average">Average</option>
                <option value="broad">Broad</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
          </div>

          <button
            onClick={suggestSize}
            disabled={!height || !weight}
            className="mt-3 w-full bg-black text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Sparkles size={16} /> Suggest My Size
          </button>

          {recommended && (
            <div className="mt-4 p-4 bg-[#d4a853]/10 border border-[#d4a853]/20 rounded-xl animate-fadeIn">
              <p className="text-xs text-gray-500 mb-1">Recommended Size</p>
              <p className="text-2xl font-bold text-gray-900">{recommended}</p>
              <p className="text-xs text-gray-400 mt-1">Based on your height and weight</p>
              {onSelectSize && availableSizes.includes(recommended) && (
                <button
                  onClick={() => onSelectSize(recommended)}
                  className="mt-2 text-xs font-medium text-[#d4a853] underline underline-offset-2 hover:text-[#c49a3f]"
                >
                  Select {recommended}
                </button>
              )}
            </div>
          )}

          {/* Mini size chart */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 pr-2 text-left font-semibold">Size</th>
                  <th className="py-2 px-2 text-center font-semibold">Chest (in)</th>
                  <th className="py-2 px-2 text-center font-semibold">Waist (in)</th>
                </tr>
              </thead>
              <tbody>
                {sizeChart.filter((s) => availableSizes.includes(s.size)).map((row) => (
                  <tr key={row.size} className={`border-b border-gray-100 last:border-0 ${recommended === row.size ? 'bg-[#d4a853]/10 font-semibold' : ''}`}>
                    <td className="py-2 pr-2 font-medium">{row.size}</td>
                    <td className="py-2 px-2 text-center">{row.chestMin}-{row.chestMax}</td>
                    <td className="py-2 px-2 text-center">{row.waistMin}-{row.waistMax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
