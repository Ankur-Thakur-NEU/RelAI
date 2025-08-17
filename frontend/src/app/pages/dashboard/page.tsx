'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FullWalletButton } from '@/components/WalletButton';
import { useMultiWallet } from '@/hooks/useMultiWallet';
import { useSubgraphData, formatAgentForDashboard, calculateMetricsFromAgents } from '@/hooks/useSubgraphData';

// Mock CountUp component
const CountUp = ({ end, duration }: { end: number; duration: number }) => {
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

// Enhanced ChatInterface component with wallet integration and API calls
const ChatInterface = () => {
  const { isConnected, walletType, chainId, getNetworkName } = useMultiWallet();
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{id: number; type: 'user' | 'ai'; content: string; timestamp: Date}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleExecuteCommand = async () => {
    if (!chatInput.trim() || !isConnected || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user' as const,
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setChatInput('');

    try {
      const response = await fetch('/api/buyer-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Parse the complex response structure
      let responseText = 'No response received';
      if (data.result) {
        if (typeof data.result === 'string') {
          responseText = data.result;
        } else if (data.result.output && Array.isArray(data.result.output)) {
          // Handle the complex structure: result.output[].text
          responseText = data.result.output
            .map((item: { text?: string }) => item.text || '')
            .filter((text: string) => text.trim())
            .join('\n\n');
        } else if (data.result.input) {
          // Fallback to showing the input if no output
          responseText = `Processed: ${data.result.input}`;
        } else {
          // Fallback to stringifying the result
          responseText = JSON.stringify(data.result, null, 2);
        }
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai' as const,
        content: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('[CHAT] API call failed:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai' as const,
        content: `Error: Failed to process command. ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecuteCommand();
    }
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="h-full flex flex-col justify-end">
      <div className="flex-1 bg-black/40 backdrop-blur-xl rounded border border-gray-600/30 p-6 mb-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-600/30">
          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded flex items-center justify-center">
            <span className="text-black font-bold text-xs font-mono">AI</span>
          </div>
          <h3 className="text-lg font-bold text-white font-mono">RelAI Assistant</h3>
          <div className="ml-auto flex items-center gap-2 text-xs font-mono text-gray-400">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              isConnected ? 'bg-green-400' : 'bg-yellow-400'
            }`}></div>
            <span>{isConnected ? 'WALLET CONNECTED' : 'WALLET REQUIRED'}</span>
          </div>
        </div>
        
        <div className="space-y-4 mb-6 h-64 overflow-y-auto" id="chat-messages">
          {/* System initialization message */}
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded flex items-center justify-center text-black text-xs font-bold font-mono">AI</div>
            <div className="bg-black/60 backdrop-blur-sm rounded border border-gray-600/30 p-3 flex-1">
              <p className="text-green-400 font-mono text-sm">
                &gt; SYSTEM INITIALIZED<br/>
                &gt; Welcome to RelAI Cross-Chain Agent Management Terminal<br/>
                {isConnected ? (
                  <>
                    &gt; WALLET: {walletType?.toUpperCase()} Connected<br/>
                    &gt; NETWORK: {chainId ? getNetworkName(chainId) : 'Unknown'}<br/>
                    &gt; Ready for agent interactions and cross-chain operations<br/>
                    &gt; Type your command below and click EXEC or press Enter
                  </>
                ) : (
                  '> Please connect your wallet to access agent management features'
                )}
              </p>
            </div>
          </div>
          
          {/* Dynamic chat messages */}
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : ''}`}>
              {message.type === 'ai' && (
                <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded flex items-center justify-center text-black text-xs font-bold font-mono">AI</div>
              )}
              <div className={`bg-black/60 backdrop-blur-sm rounded border border-gray-600/30 p-3 ${message.type === 'user' ? 'max-w-xs' : 'flex-1'}`}>
                <p className={`font-mono text-sm ${message.type === 'user' ? 'text-white' : 'text-green-400'}`}>
                  {message.type === 'ai' && '> '}
                  {message.content}
                </p>
                <div className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              {message.type === 'user' && (
                <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center text-white text-xs font-bold font-mono">U</div>
              )}
            </div>
          ))}

          {/* Loading message */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded flex items-center justify-center text-black text-xs font-bold font-mono">AI</div>
              <div className="bg-black/60 backdrop-blur-sm rounded border border-gray-600/30 p-3 flex-1">
                <div className="flex items-center gap-2 text-yellow-400 font-mono text-sm">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  &gt; Processing command...
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 border-t border-gray-600/30 pt-4">
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "> Enter command or query..." : "> Connect wallet to enable AI interactions..."}
            className="flex-1 px-4 py-2 bg-black/60 border border-gray-600/30 rounded text-green-400 placeholder-gray-500 focus:border-green-400/50 focus:outline-none font-mono text-sm transition-all duration-300"
            disabled={!isConnected || isLoading}
          />
          <button 
            onClick={handleExecuteCommand}
            className={`px-4 py-2 rounded transition-all duration-300 font-mono font-bold text-sm flex items-center gap-2 ${
              isConnected && !isLoading
                ? 'bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-black'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isConnected || isLoading || !chatInput.trim()}
          >
            {isLoading ? (
              <>
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                EXEC
              </>
            ) : (
              'EXEC'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced AI agent data with cross-chain information
interface AgentMetrics {
  tasksCompleted: number;
  avgTime: number;
  successRate: number;
  toolSelection: string;
  avgCost: number;
}

const initialMetrics: AgentMetrics = {
  tasksCompleted: 120,
  avgTime: 35,
  successRate: 87,
  toolSelection: 'Cross-Chain Bridge',
  avgCost: 250
};

const agentData: Record<string, AgentMetrics> = {
  'GPT-Trading-Bot': { tasksCompleted: 50, avgTime: 30, successRate: 92, toolSelection: 'DEX Arbitrage', avgCost: 200 },
  'DeFi-Yield-Optimizer': { tasksCompleted: 30, avgTime: 40, successRate: 89, toolSelection: 'Yield Farming', avgCost: 300 },
  'NFT-Price-Predictor': { tasksCompleted: 40, avgTime: 35, successRate: 78, toolSelection: 'ML Prediction', avgCost: 250 },
  'Cross-Chain-Arbitrage': { tasksCompleted: 25, avgTime: 28, successRate: 95, toolSelection: 'CCIP Bridge', avgCost: 220 },
  'Risk-Assessment-AI': { tasksCompleted: 35, avgTime: 45, successRate: 88, toolSelection: 'Risk Analysis', avgCost: 280 },
  'Liquidity-Provider-Bot': { tasksCompleted: 45, avgTime: 32, successRate: 85, toolSelection: 'LP Strategy', avgCost: 230 },
  'Portfolio-Rebalancer': { tasksCompleted: 20, avgTime: 50, successRate: 82, toolSelection: 'Auto Rebalance', avgCost: 310 },
  'MEV-Protection-AI': { tasksCompleted: 60, avgTime: 33, successRate: 91, toolSelection: 'MEV Shield', avgCost: 240 },
  'Governance-Voter': { tasksCompleted: 15, avgTime: 38, successRate: 80, toolSelection: 'DAO Voting', avgCost: 260 },
  'Flash-Loan-Optimizer': { tasksCompleted: 55, avgTime: 29, successRate: 87, toolSelection: 'Flash Loans', avgCost: 210 }
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [loaded, setLoaded] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const router = useRouter();
  const { isConnected, address, formatAddress, disconnect, chainId, getNetworkName } = useMultiWallet();
  const { data: subgraphData, isLoading: subgraphLoading, error: subgraphError } = useSubgraphData();

  // Redirect to main page if wallet is not connected
  useEffect(() => {
    const checkWalletConnection = () => {
      if (typeof window !== 'undefined' && !isConnected) {
        console.log('[DASHBOARD] No wallet connected, redirecting to main page...');
        setIsRedirecting(true);
        router.push('/');
      }
    };

    // Wait a bit to allow wallet connection state to initialize
    const timer = setTimeout(checkWalletConnection, 1000);
    return () => clearTimeout(timer);
  }, [isConnected, router]);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Update metrics when subgraph data is loaded
  useEffect(() => {
    if (subgraphData?.agents) {
      const calculatedMetrics = calculateMetricsFromAgents(subgraphData.agents);
      setMetrics(calculatedMetrics);
    }
  }, [subgraphData]);

  const handleAgentClick = (agent: string) => {
    setMetrics(agentData[agent] || initialMetrics);
    setSelectedAgent(agent);
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' 
      ? 'text-green-400 bg-green-400/20 border-green-400/30' 
      : 'text-red-400 bg-red-400/20 border-red-400/30';
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return 'from-green-400 to-green-500';
    if (rate >= 80) return 'from-yellow-400 to-yellow-500';
    return 'from-red-400 to-red-500';
  };

  // Get real agent data from subgraph or fallback to mock data
  const taskData = subgraphData?.agents 
    ? subgraphData.agents.map(agent => formatAgentForDashboard(agent))
    : [
        { id: 1, agent: 'GPT-Trading-Bot', status: 'Active', time: 30, reputation: 86, address: '0x1111...' },
        { id: 2, agent: 'DeFi-Yield-Optimizer', status: 'Active', time: 40, reputation: 99, address: '0x2222...' },
        { id: 3, agent: 'NFT-Price-Predictor', status: 'Active', time: 35, reputation: 83, address: '0x3333...' },
        { id: 4, agent: 'Cross-Chain-Arbitrage', status: 'Active', time: 28, reputation: 99, address: '0x4444...' },
        { id: 5, agent: 'Risk-Assessment-AI', status: 'Active', time: 45, reputation: 94, address: '0x5555...' }
      ];

  // Show loading screen while redirecting
  if (isRedirecting || !isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white font-mono text-lg mb-4">RelAI Dashboard</div>
          <div className="text-gray-400 font-mono text-sm mb-6">
            {isRedirecting ? 'Redirecting...' : 'Wallet connection required'}
          </div>
          <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center p-6 bg-black/60 backdrop-blur-xl border-b border-gray-600/30 z-50">
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-white font-mono cursor-pointer" onClick={() => window.location.href = '/'}>RelAI</div>
          <p className="text-xs text-gray-400 font-mono">CROSS-CHAIN AI AGENT REPUTATION SYSTEM</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Wallet Status Display */}
          {isConnected && address ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-green-400/30 rounded-lg font-mono text-sm text-white backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400">{formatAddress(address)}</span>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-xs text-gray-400">{getNetworkName(chainId || 0)}</span>
              </div>
              <button
                onClick={disconnect}
                className="px-3 py-2 bg-black/40 hover:bg-red-500/20 border border-gray-600/30 hover:border-red-400/50 rounded-lg text-gray-400 hover:text-red-400 transition-all duration-200 backdrop-blur-sm font-mono text-xs"
                title="Disconnect wallet"
              >
                DISCONNECT
              </button>
            </div>
          ) : (
            <FullWalletButton />
          )}
        </div>
      </header>

      <div className="relative z-0 h-screen flex flex-row text-white">
        {/* Sidebar */}
        <aside className="w-1/3 p-6 bg-black/40 backdrop-blur-xl border-r border-gray-600/30 flex flex-col gap-6 overflow-y-auto pt-24">
          {/* Metrics Grid */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-bold text-green-400 font-mono">
                {isConnected ? 'AI AGENT METRICS' : 'SYSTEM OVERVIEW'}
              </h2>
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

          {/* AI Agent Registry Table */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-bold text-green-400 font-mono">AI_AGENT_REGISTRY</h2>
              <div className="flex-1 h-px bg-gray-600/30"></div>
              {subgraphLoading && (
                <div className="text-xs text-yellow-400 font-mono flex items-center gap-1">
                  <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin"></div>
                  LOADING...
                </div>
              )}
              {subgraphError && (
                <div className="text-xs text-red-400 font-mono">
                  SUBGRAPH ERROR
                </div>
              )}
            </div>
            
            <div className="bg-black/60 backdrop-blur-xl rounded border border-gray-600/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-600/30">
                      <th className="p-3 text-left text-xs font-mono text-gray-400">ID</th>
                      <th className="p-3 text-left text-xs font-mono text-gray-400">AI_AGENT</th>
                      <th className="p-3 text-left text-xs font-mono text-gray-400">STATUS</th>
                      <th className="p-3 text-left text-xs font-mono text-gray-400">REPUTATION</th>
                      <th className="p-3 text-left text-xs font-mono text-gray-400">TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskData.map((task) => (
                      <tr 
                        key={task.id}
                        className={`border-b border-gray-600/20 cursor-pointer transition-all duration-200 hover:bg-black/60 ${selectedAgent === task.agent ? 'bg-black/80 border-green-400/30' : ''} ${!isConnected ? 'opacity-50' : ''}`}
                        onClick={() => isConnected && handleAgentClick(task.agent)}
                      >
                        <td className="p-3">
                          <div className="text-green-400 font-mono text-sm">
                            {task.id.toString().padStart(3, '0')}
                          </div>
                        </td>
                        <td className="p-3 text-white font-mono text-xs">{task.agent}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-mono border ${getStatusColor(task.status)}`}>
                            {task.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-full bg-gray-800 rounded h-1 ${task.reputation ? '' : 'hidden'}`}>
                              <div 
                                className={`h-1 rounded transition-all duration-1000 ${getPerformanceColor(task.reputation || 0)}`}
                                style={{ width: `${task.reputation || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-green-400 font-mono text-sm min-w-8">
                              {task.reputation || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-green-400 font-mono text-sm">{task.time}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cross-chain info */}
            {isConnected && (
              <div className="mt-4 p-3 bg-black/40 backdrop-blur-xl rounded border border-blue-400/30">
                <div className="text-xs text-blue-400 font-mono mb-1">CROSS-CHAIN STATUS</div>
                <div className="text-sm text-white font-mono">
                  {">"}  Subgraph: <a href="https://thegraph.com/studio/subgraph/rel-aidao/" target="_blank" className="text-blue-400 hover:text-blue-300">rel-aidao</a><br/>
                  {">"}  CCIP: Hedera {"<->"} Sepolia Active<br/>
                  {">"}  Live Data: {subgraphData?.agents?.length || 0} AI agents, {subgraphData?.transactions?.length || 0} transactions
                </div>
              </div>
            )}
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
