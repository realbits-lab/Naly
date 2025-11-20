'use client';

import { useState } from 'react';
import { generateContent } from './actions';
import { ReporterInput } from '@/lib/agents/types';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [topic, setTopic] = useState<ReporterInput['topic']>('stock');
  const [region, setRegion] = useState<ReporterInput['region']>('US');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateContent({ topic, region });
      setResult(data);
    } catch (error) {
      console.error(error);
      alert('Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Naly: Predictive Content Service</h1>
          <p className="text-gray-600">AI-powered content generation workflow</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Topic</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value as any)}
                className="w-full p-2 border rounded-md"
              >
                <option value="stock">Stock</option>
                <option value="coin">Coin</option>
                <option value="sports">Sports</option>
                <option value="politics">Politics</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as any)}
                className="w-full p-2 border rounded-md"
              >
                <option value="US">US</option>
                <option value="KR">KR</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating Content...' : 'Start Workflow'}
          </button>
        </div>

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Reporter Section */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
                <h2 className="text-xl font-semibold">AI Reporter</h2>
              </div>
              <div className="prose max-w-none">
                <h3 className="text-lg font-medium">{result.reporter.title}</h3>
                <div className="flex gap-2 my-2">
                  {result.reporter.trends.map((trend: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded-full">{trend}</span>
                  ))}
                </div>
                <p className="text-gray-600 text-sm line-clamp-3">{result.reporter.content}</p>
              </div>
            </section>

            {/* Editor Section */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">2</div>
                <h2 className="text-xl font-semibold">AI Editor</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${result.editor.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {result.editor.status.toUpperCase()}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Changes Made:</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {result.editor.changes.map((change: string, i: number) => (
                      <li key={i}>{change}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Designer Section */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">3</div>
                <h2 className="text-xl font-semibold">AI Designer</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {result.designer.assets.map((asset: any, i: number) => (
                  <div key={i} className="border rounded-lg overflow-hidden">
                    <img src={asset.url} alt={asset.alt} className="w-full h-32 object-cover" />
                    <div className="p-2 bg-gray-50 text-xs text-gray-500">
                      <span className="font-bold uppercase mr-2">{asset.type}</span>
                      {asset.alt}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-600 italic">Layout: {result.designer.layoutSuggestion}</p>
            </section>

            {/* Marketer Section */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">4</div>
                <h2 className="text-xl font-semibold">AI Marketer</h2>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900">{result.marketer.predictedMetrics.retention}%</div>
                  <div className="text-xs text-gray-500 uppercase">Retention</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900">{result.marketer.predictedMetrics.views}</div>
                  <div className="text-xs text-gray-500 uppercase">Views</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900">{result.marketer.predictedMetrics.clicks}</div>
                  <div className="text-xs text-gray-500 uppercase">Clicks</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Ad Placements:</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.marketer.adPlacements.map((ad: any, i: number) => (
                      <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-100">
                        {ad.position} ({ad.type})
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <h3 className="font-medium text-yellow-800 mb-1">Ultrathink Strategy:</h3>
                  <p className="text-sm text-yellow-700">{result.marketer.strategy}</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
