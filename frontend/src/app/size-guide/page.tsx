import { Ruler, Info, ArrowUp } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Size Guide',
  description: 'Find your perfect fit with our detailed size guide. Measurements in inches and centimeters for all our garments.',
};

const sizeData = [
  { size: 'S', chest: '36-38', chestCm: '91-97', waist: '30-32', waistCm: '76-81', length: '26', lengthCm: '66' },
  { size: 'M', chest: '38-40', chestCm: '97-102', waist: '32-34', waistCm: '81-86', length: '27', lengthCm: '69' },
  { size: 'L', chest: '40-42', chestCm: '102-107', waist: '34-36', waistCm: '86-91', length: '28', lengthCm: '71' },
  { size: 'XL', chest: '42-44', chestCm: '107-112', waist: '36-38', waistCm: '91-97', length: '29', lengthCm: '74' },
  { size: 'XXL', chest: '44-46', chestCm: '112-117', waist: '38-40', waistCm: '97-102', length: '30', lengthCm: '76' },
];

const howToMeasure = [
  { label: 'Chest', instruction: 'Measure around the fullest part of your chest, keeping the tape horizontal and snug but not tight.' },
  { label: 'Waist', instruction: 'Measure around your natural waistline, the narrowest part of your torso, just above your belly button.' },
  { label: 'Length', instruction: 'Measure from the highest point of the shoulder down to the bottom hem of the garment.' },
];

export default function SizeGuidePage() {
  return (
    <div className="container-custom py-12">
      {/* Hero */}
      <div className="bg-black text-white p-8 md:p-12 mb-12">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Ruler size={20} className="text-[#d4a853]" />
            <span className="text-[#d4a853] text-sm font-medium tracking-wider uppercase">Size Guide</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Your Perfect Fit</h1>
          <p className="text-gray-300 leading-relaxed">
            Use our comprehensive size chart to find the ideal size for your body type. All measurements are in inches and centimeters.
          </p>
        </div>
      </div>

      {/* Brand Note */}
      <div className="bg-[#d4a853]/10 border border-[#d4a853]/30 p-6 mb-10 flex items-start gap-3">
        <Info size={20} className="text-[#d4a853] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Our sizes run true to fit.</span> If you are between sizes, we recommend sizing up for a comfortable fit.
        </p>
      </div>

      {/* Size Chart Table */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-6">Size Chart</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="px-6 py-4 text-left text-sm font-semibold">Size</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">
                  Chest (in)<br /><span className="font-normal text-gray-400">cm</span>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold">
                  Waist (in)<br /><span className="font-normal text-gray-400">cm</span>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold">
                  Length (in)<br /><span className="font-normal text-gray-400">cm</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sizeData.map((row, i) => (
                <tr key={row.size} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-12 h-12 bg-black text-white font-bold text-sm">{row.size}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium">{row.chest}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{row.chestCm}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium">{row.waist}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{row.waistCm}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium">{row.length}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{row.lengthCm}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* How to Measure */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-6">How to Measure</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {howToMeasure.map((item) => (
            <div key={item.label} className="border p-6">
              <div className="w-12 h-12 bg-[#d4a853]/10 flex items-center justify-center mb-4">
                <ArrowUp size={20} className="text-[#d4a853]" />
              </div>
              <h3 className="font-semibold mb-2">{item.label}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.instruction}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gray-50 p-8">
        <h2 className="text-xl font-bold mb-4">Measuring Tips</h2>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4a853] mt-1.5 flex-shrink-0" />
            Take measurements over lightweight clothing for the most accurate results.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4a853] mt-1.5 flex-shrink-0" />
            Keep the measuring tape snug but not tight against the body.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4a853] mt-1.5 flex-shrink-0" />
            If you fall between two sizes, we recommend sizing up.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4a853] mt-1.5 flex-shrink-0" />
            Our garments may vary slightly by +/- 1 inch due to the handmade nature of production.
          </li>
        </ul>
      </div>
    </div>
  );
}
