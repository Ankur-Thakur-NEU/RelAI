'use client';

import { useEffect, useState } from 'react';

// Mock CountUp component
const CountUp = ({ end, duration }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev >= end) {
          clearInterval(timer);
          return end;
        }
        return prev + Math.ceil(end / (duration * 10));
      });
    }, 100);
    
    return () => clearInterval(timer);
  }, [end, duration]);
  
  return <span>{Math.min(count, end)}</span>;
};

// Mock ChatInterface component with homepage styling
const ChatInterface = () => (
  <div className="h-full flex flex-col justify-end">
    <div className="flex-1 bg-black/40 backdrop-blur-xl rounded border border-gray-600/30 p-6 mb-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-600/30">
        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded flex items-center justify-center">
          <span className="text-black font-bold text-xs font-mono">AI</span>
        </div>
        <h3 className="text-lg font-bold text-white font-mono">RelAI Assistant</h3>
        <div className="ml-auto flex items-center gap-2 text-xs font-mono text-gray-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>ACTIVE</span>
        </div>
      </div>
      
      <div className="space-y-4 mb-6 h-64 overflow-y-auto">
        <div className="flex gap-3">
          <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded flex items-center justify-center text-black text-xs font-bold font-mono">AI</div>
          <div className="bg-black/60 backdrop-blur-sm rounded border border-gray-600/30 p-3 flex-1">
            <p className="text-green-400 font-mono text-sm">
              &gt; SYSTEM INITIALIZED<br/>
              &gt; Welcome to RelAI Agent Management Terminal<br/>
              &gt; Type commands or ask questions about your agents
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 justify-end">
          <div className="bg-black/60 backdrop-blur-sm rounded border border-gray-600/30 p-3 max-w-xs">
            <p className="text-white font-mono text-sm">show agent performance metrics</p>
          </div>
          <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center text-white text-xs font-bold font-mono">U</div>
        </div>
        
        <div className="flex gap-3">
          <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded flex items-center justify-center text-black text-xs font-bold font-mono">AI</div>
          <div className="bg-black/60 backdrop-blur-sm rounded border border-gray-600/30 p-3 flex-1">
            <p className="text-green-400 font-mono text-sm">
              &gt; RETRIEVING AGENT METRICS...<br/>
              &gt; AGENT_A: STATUS=OPERATIONAL, PERFORMANCE=90%<br/>
              &gt; AGENT_B: STATUS=OPERATIONAL, PERFORMANCE=70%<br/>
              &gt; Use sidebar controls for detailed analysis
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 border-t border-gray-600/30 pt-4">
        <input 
          type="text" 
          placeholder="> Enter command or query..."
          className="flex-1 px-4 py-2 bg-black/60 border border-gray-600/30 rounded text-green-400 placeholder-gray-500 focus:border-green-400/50 focus:outline-none font-mono text-sm transition-all duration-300"
        />
        <button className="px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-black rounded transition-all duration-300 font-mono font-bold text-sm">
          EXEC
        </button>
      </div>
    </div>
  </div>
);

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

  const getStatusColor = (status) => {
    return status === 'Success' 
      ? 'text-green-400 bg-green-400/20 border-green-400/30' 
      : 'text-red-400 bg-red-400/20 border-red-400/30';
  };

  const getPerformanceColor = (rate) => {
    if (rate >= 90) return 'from-green-400 to-green-500';
    if (rate >= 80) return 'from-yellow-400 to-yellow-500';
    return 'from-red-400 to-red-500';
  };

  const taskData = [
    { id: 1, agent: 'Agent A', status: 'Success', time: 32 },
    { id: 2, agent: 'Agent B', status: 'Failure', time: 45 },
    { id: 3, agent: 'Agent C', status: 'Success', time: 38 },
    { id: 4, agent: 'Agent D', status: 'Success', time: 28 },
    { id: 5, agent: 'Agent E', status: 'Failure', time: 45 },
    { id: 6, agent: 'Agent F', status: 'Success', time: 32 },
    { id: 7, agent: 'Agent G', status: 'Failure', time: 50 },
    { id: 8, agent: 'Agent H', status: 'Success', time: 33 },
    { id: 9, agent: 'Agent I', status: 'Success', time: 38 },
    { id: 10, agent: 'Agent J', status: 'Success', time: 29 }
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center p-6 bg-black/60 backdrop-blur-xl border-b border-gray-600/30 z-50">
        <div className="flex items-center gap-4">
          <a href="/" className="text-3xl font-bold text-white font-mono">RelAI</a>
          <p className="text-xs text-gray-400 font-mono">DECENTRALIZED AI AGENT MANAGEMENT</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>CONNECTED</span>
          </div>
          <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-white font-bold font-mono cursor-pointer hover:bg-gray-500 transition-colors">
            U
          </div>
        </div>
      </header>

      <div className="relative z-0 h-screen flex flex-row text-white">
        {/* Sidebar */}
        <aside className="w-1/3 p-6 bg-black/40 backdrop-blur-xl border-r border-gray-600/30 flex flex-col gap-6 overflow-y-auto pt-24">
          {/* Metrics Grid */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-bold text-green-400 font-mono">SYSTEM METRICS</h2>
              <div className="flex-1 h-px bg-gray-600/30"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-black/60 backdrop-blur-xl rounded border border-gray-600/30 hover:border-green-400/50 transition-all duration-300">
                <div className="text-xs text-gray-400 font-mono mb-1">TASKS_COMPLETED</div>
                <div className="text-2xl font-bold text-green-400 font-mono">
                  {loaded ? <CountUp end={metrics.tasksCompleted} duration={1.5} /> : 0}
                </div>
              </div>

              <div className="p-4 bg-black/60 backdrop-blur-xl rounded border border-gray-600/30 hover:border-green-400/50 transition-all duration-300">
                <div className="text-xs text-gray-400 font-mono mb-1">AVG_TIME_MIN</div>
                <div className="text-2xl font-bold text-green-400 font-mono">
                  {loaded ? <CountUp end={metrics.avgTime} duration={1.5} /> : 0}
                </div>
              </div>

              <div className="p-4 bg-black/60 backdrop-blur-xl rounded border border-gray-600/30 hover:border-green-400/50 transition-all duration-300">
                <div className="text-xs text-gray-400 font-mono mb-1">SUCCESS_RATE</div>
                <div className="flex items-end gap-1">
                  <div className="text-2xl font-bold text-green-400 font-mono">
                    {loaded ? <CountUp end={metrics.successRate} duration={1.5} /> : 0}
                  </div>
                  <span className="text-sm text-gray-400 font-mono mb-1">%</span>
                </div>
                <div className="mt-2 w-full bg-gray-800 rounded h-1">
                  <div 
                    className={`h-1 bg-gradient-to-r ${getPerformanceColor(metrics.successRate)} rounded transition-all duration-1000`}
                    style={{ width: loaded ? `${metrics.successRate}%` : '0%' }}
                  ></div>
                </div>
              </div>

              <div className="p-4 bg-black/60 backdrop-blur-xl rounded border border-gray-600/30 hover:border-green-400/50 transition-all duration-300">
                <div className="text-xs text-gray-400 font-mono mb-1">TOOL_SELECTION</div>
                <div className="text-lg font-bold text-green-400 font-mono">{metrics.toolSelection}</div>
              </div>

              <div className="p-4 bg-black/60 backdrop-blur-xl rounded border border-gray-600/30 hover:border-green-400/50 transition-all duration-300 col-span-2">
                <div className="text-xs text-gray-400 font-mono mb-1">AVG_COST_USD</div>
                <div className="flex items-end gap-1">
                  <span className="text-lg text-gray-400 font-mono">$</span>
                  <div className="text-2xl font-bold text-green-400 font-mono">
                    {loaded ? <CountUp end={metrics.avgCost} duration={1.5} /> : 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Task Details Table */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-bold text-green-400 font-mono">AGENT_REGISTRY</h2>
              <div className="flex-1 h-px bg-gray-600/30"></div>
            </div>
            
            <div className="bg-black/60 backdrop-blur-xl rounded border border-gray-600/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-600/30">
                      <th className="p-3 text-left text-xs font-mono text-gray-400">ID</th>
                      <th className="p-3 text-left text-xs font-mono text-gray-400">AGENT</th>
                      <th className="p-3 text-left text-xs font-mono text-gray-400">STATUS</th>
                      <th className="p-3 text-left text-xs font-mono text-gray-400">TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskData.map((task) => (
                      <tr 
                        key={task.id}
                        className={`border-b border-gray-600/20 cursor-pointer transition-all duration-200 hover:bg-black/60 ${selectedAgent === task.agent ? 'bg-black/80 border-green-400/30' : ''}`}
                        onClick={() => handleAgentClick(task.agent)}
                      >
                        <td className="p-3">
                          <div className="text-green-400 font-mono text-sm">
                            {task.id.toString().padStart(3, '0')}
                          </div>
                        </td>
                        <td className="p-3 text-white font-mono text-sm">{task.agent}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-mono border ${getStatusColor(task.status)}`}>
                            {task.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-green-400 font-mono text-sm">{task.time}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 pt-24">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
}