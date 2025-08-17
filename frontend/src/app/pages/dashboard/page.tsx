'use client';

import { useEffect, useState } from 'react';
import CountUp from 'react-countup';
import ChatInterface from '@/components/ChatInterface';

const initialMetrics = {
  tasksCompleted: 120,
  avgTime: 35,
  successRate: 87,
  toolSelection: 'Tool A',
  avgCost: 250
};

const agentData = {
  'Agent A': { tasksCompleted: 50, avgTime: 30, successRate: 90, toolSelection: 'Tool A', avgCost: 200 },
  'Agent B': { tasksCompleted: 30, avgTime: 40, successRate: 70, toolSelection: 'Tool B', avgCost: 300 },
  'Agent C': { tasksCompleted: 40, avgTime: 35, successRate: 85, toolSelection: 'Tool C', avgCost: 250 },
  'Agent D': { tasksCompleted: 25, avgTime: 28, successRate: 88, toolSelection: 'Tool D', avgCost: 220 },
  'Agent E': { tasksCompleted: 35, avgTime: 45, successRate: 75, toolSelection: 'Tool E', avgCost: 280 },
  'Agent F': { tasksCompleted: 45, avgTime: 32, successRate: 92, toolSelection: 'Tool F', avgCost: 230 },
  'Agent G': { tasksCompleted: 20, avgTime: 50, successRate: 65, toolSelection: 'Tool G', avgCost: 310 },
  'Agent H': { tasksCompleted: 60, avgTime: 33, successRate: 87, toolSelection: 'Tool H', avgCost: 240 },
  'Agent I': { tasksCompleted: 15, avgTime: 38, successRate: 80, toolSelection: 'Tool I', avgCost: 260 },
  'Agent J': { tasksCompleted: 55, avgTime: 29, successRate: 95, toolSelection: 'Tool J', avgCost: 210 }
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [loaded, setLoaded] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAgentClick = (agent) => {
    setMetrics(agentData[agent] || initialMetrics);
    setSelectedAgent(agent);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0f0f0f] text-white">
      <header className="flex justify-between items-center p-4 bg-[#1a1a1a] border-b border-gray-700">
        <h1 className="text-2xl font-bold">RelAI</h1>
        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold cursor-pointer">
          U
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/3 p-6 bg-[#1b1b1b] flex flex-col gap-6 overflow-y-auto border-r border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#2a2a2a] rounded-lg shadow-md flex justify-between items-center h-32">
              <div>
                <p className="text-sm text-gray-400">Tasks Completed</p>
                <p className="text-2xl font-bold">
                  {loaded ? <CountUp end={metrics.tasksCompleted} duration={1.5} /> : 0}
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#2a2a2a] rounded-lg shadow-md flex justify-between items-center h-32">
              <div>
                <p className="text-sm text-gray-400">Average Time (min)</p>
                <p className="text-2xl font-bold">
                  {loaded ? <CountUp end={metrics.avgTime} duration={1.5} /> : 0}
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#2a2a2a] rounded-lg shadow-md flex justify-between items-center h-32">
              <div>
                <p className="text-sm text-gray-400">Success Rate (%)</p>
                <p className="text-2xl font-bold">
                  {loaded ? <CountUp end={metrics.successRate} duration={1.5} /> : 0}
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#2a2a2a] rounded-lg shadow-md flex justify-between items-center h-32">
              <div>
                <p className="text-sm text-gray-400">Tool Selection</p>
                <p className="text-2xl font-bold">{metrics.toolSelection}</p>
              </div>
            </div>

            <div className="p-4 bg-[#2a2a2a] rounded-lg shadow-md flex justify-between items-center h-32 col-span-2">
              <div>
                <p className="text-sm text-gray-400">Average Cost ($)</p>
                <p className="text-2xl font-bold">
                  {loaded ? <CountUp end={metrics.avgCost} duration={1.5} /> : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Task Details</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-[#1b1b1b]">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="p-2">Task ID</th>
                    <th className="p-2">Agent</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Time Taken (min)</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  <tr className={`border-t border-gray-700 cursor-pointer ${selectedAgent === 'Agent A' ? 'bg-[#3a3a3a]' : 'hover:bg-[#2a2a2a]'}`} onClick={() => handleAgentClick('Agent A')}>
                    <td className="p-2">1</td>
                    <td className="p-2">Agent A</td>
                    <td className="p-2">Success</td>
                    <td className="p-2">32</td>
                  </tr>
                  <tr className={`border-t border-gray-700 cursor-pointer ${selectedAgent === 'Agent B' ? 'bg-[#3a3a3a]' : 'hover:bg-[#2a2a2a]'}`} onClick={() => handleAgentClick('Agent B')}>
                    <td className="p-2">2</td>
                    <td className="p-2">Agent B</td>
                    <td className="p-2">Failure</td>
                    <td className="p-2">45</td>
                  </tr>
                  <tr className={`border-t border-gray-700 cursor-pointer ${selectedAgent === 'Agent C' ? 'bg-[#3a3a3a]' : 'hover:bg-[#2a2a2a]'}`} onClick={() => handleAgentClick('Agent C')}>
                    <td className="p-2">3</td>
                    <td className="p-2">Agent C</td>
                    <td className="p-2">Success</td>
                    <td className="p-2">38</td>
                  </tr>
                  <tr className={`border-t border-gray-700 cursor-pointer ${selectedAgent === 'Agent D' ? 'bg-[#3a3a3a]' : 'hover:bg-[#2a2a2a]'}`} onClick={() => handleAgentClick('Agent D')}>
                    <td className="p-2">4</td>
                    <td className="p-2">Agent D</td>
                    <td className="p-2">Success</td>
                    <td className="p-2">28</td>
                  </tr>
                  <tr className={`border-t border-gray-700 cursor-pointer ${selectedAgent === 'Agent E' ? 'bg-[#3a3a3a]' : 'hover:bg-[#2a2a2a]'}`} onClick={() => handleAgentClick('Agent E')}>
                    <td className="p-2">5</td>
                    <td className="p-2">Agent E</td>
                    <td className="p-2">Failure</td>
                    <td className="p-2">45</td>
                  </tr>
                  <tr className={`border-t border-gray-700 cursor-pointer ${selectedAgent === 'Agent F' ? 'bg-[#3a3a3a]' : 'hover:bg-[#2a2a2a]'}`} onClick={() => handleAgentClick('Agent F')}>
                    <td className="p-2">6</td>
                    <td className="p-2">Agent F</td>
                    <td className="p-2">Success</td>
                    <td className="p-2">32</td>
                  </tr>
                  <tr className={`border-t border-gray-700 cursor-pointer ${selectedAgent === 'Agent G' ? 'bg-[#3a3a3a]' : 'hover:bg-[#2a2a2a]'}`} onClick={() => handleAgentClick('Agent G')}>
                    <td className="p-2">7</td>
                    <td className="p-2">Agent G</td>
                    <td className="p-2">Failure</td>
                    <td className="p-2">50</td>
                  </tr>
                  <tr className={`border-t border-gray-700 cursor-pointer ${selectedAgent === 'Agent H' ? 'bg-[#3a3a3a]' : 'hover:bg-[#2a2a2a]'}`} onClick={() => handleAgentClick('Agent H')}>
                    <td className="p-2">8</td>
                    <td className="p-2">Agent H</td>
                    <td className="p-2">Success</td>
                    <td className="p-2">33</td>
                  </tr>
                  <tr className={`border-t border-gray-700 cursor-pointer ${selectedAgent === 'Agent I' ? 'bg-[#3a3a3a]' : 'hover:bg-[#2a2a2a]'}`} onClick={() => handleAgentClick('Agent I')}>
                    <td className="p-2">9</td>
                    <td className="p-2">Agent I</td>
                    <td className="p-2">Success</td>
                    <td className="p-2">38</td>
                  </tr>
                  <tr className={`border-t border-gray-700 cursor-pointer ${selectedAgent === 'Agent J' ? 'bg-[#3a3a3a]' : 'hover:bg-[#2a2a2a]'}`} onClick={() => handleAgentClick('Agent J')}>
                    <td className="p-2">10</td>
                    <td className="p-2">Agent J</td>
                    <td className="p-2">Success</td>
                    <td className="p-2">29</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 bg-[#121212]">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
}