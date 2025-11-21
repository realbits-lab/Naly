'use client';

import { updateAgentConfig } from '@/app/actions';
import { useState } from 'react';

export default function AgentSettingsPage() {
  // This should ideally fetch initial data, but for simplicity we'll just use a form that updates.
  // In a real app, we'd pass initial data from a server component wrapper or fetch it here.
  // I'll make this a client component and assume the user inputs fresh values or we fetch.
  // To keep it simple and robust, let's just show the form.
  
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Agent Settings</h1>
      
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Reporter Settings */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Reporter Configuration</h2>
          <form action={async (formData) => {
            const schedule = formData.get('schedule') as string;
            const status = formData.get('status') as 'ACTIVE' | 'PAUSED';
            const topic = formData.get('topic') as string;
            const region = formData.get('region') as string;
            
            await updateAgentConfig('REPORTER', schedule, status, { topic, region });
            alert('Reporter settings saved!');
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select name="status" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Schedule (Cron)</label>
              <input type="text" name="schedule" defaultValue="0 */6 * * *" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="e.g. 0 */6 * * *" required />
              <p className="text-xs text-gray-500 mt-1">Default: Every 6 hours</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Topic</label>
              <select name="topic" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="stock">Stock</option>
                <option value="coin">Coin</option>
                <option value="sports">Sports</option>
                <option value="politics">Politics</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Region</label>
              <select name="region" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="US">US</option>
                <option value="KR">KR</option>
              </select>
            </div>
            <button type="submit" className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Save Reporter Settings
            </button>
          </form>
        </div>

        {/* Marketer Settings */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Marketer Configuration</h2>
          <form action={async (formData) => {
            const schedule = formData.get('schedule') as string;
            const status = formData.get('status') as 'ACTIVE' | 'PAUSED';
            const targetAudience = formData.get('targetAudience') as string;
            
            await updateAgentConfig('MARKETER', schedule, status, { targetAudience });
            alert('Marketer settings saved!');
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select name="status" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Schedule (Cron)</label>
              <input type="text" name="schedule" defaultValue="0 9 * * *" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="e.g. 0 9 * * *" required />
              <p className="text-xs text-gray-500 mt-1">Default: Daily at 9 AM</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Target Audience</label>
              <input type="text" name="targetAudience" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" placeholder="e.g. Tech Enthusiasts" required />
            </div>
            <button type="submit" className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500">
              Save Marketer Settings
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
