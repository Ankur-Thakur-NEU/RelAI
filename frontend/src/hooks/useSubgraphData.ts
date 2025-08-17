'use client';

import { useQuery } from '@tanstack/react-query';
import { gql, request } from 'graphql-request';

// GraphQL query to fetch agents and transactions
const SUBGRAPH_QUERY = gql`{
  agents(first: 10, orderBy: currentReputation, orderDirection: desc) {
    id
    address
    tag
    currentReputation
  }
  transactions(first: 10) {
    id
    buyer
    seller {
      id
    }
    x402Ref
  }
}`;

// The Graph API configuration
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/118822/rel-aidao/version/latest';
// Note: Replace {api-key} with actual API key if needed for production
const headers = { 
  // Authorization: 'Bearer {api-key}' 
};

// Types for the subgraph data
export interface Agent {
  id: string;
  address: string;
  tag: string;
  currentReputation: string;
}

export interface Transaction {
  id: string;
  buyer: string;
  seller: {
    id: string;
  };
  x402Ref: string;
}

export interface SubgraphData {
  agents: Agent[];
  transactions: Transaction[];
}

// Custom hook to fetch subgraph data
export const useSubgraphData = () => {
  return useQuery<SubgraphData>({
    queryKey: ['subgraph-data'],
    queryFn: async () => {
      try {
        console.log('[SUBGRAPH] Fetching data from The Graph...');
        const data = await request(SUBGRAPH_URL, SUBGRAPH_QUERY, {}, headers);
        console.log('[SUBGRAPH] Data received:', data);
        return data as SubgraphData;
      } catch (error) {
        console.error('[ERROR] Failed to fetch subgraph data:', error);
        // Log more details about the error for debugging
        if (error instanceof Error) {
          console.error('[ERROR] Error message:', error.message);
        }
        throw new Error('Failed to fetch AI agent data from subgraph');
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 3,
  });
};

// Helper function to format agent data for the dashboard
export const formatAgentForDashboard = (agent: Agent) => ({
  id: parseInt(agent.address.slice(-6), 16), // Create numeric ID from address
  agent: agent.tag,
  status: parseInt(agent.currentReputation) > 85 ? 'Active' : 'Inactive',
  time: Math.floor(Math.random() * 50) + 20, // Mock time for now
  reputation: parseInt(agent.currentReputation),
  address: agent.address,
});

// Helper function to calculate metrics from agents
export const calculateMetricsFromAgents = (agents: Agent[]) => {
  if (!agents || agents.length === 0) {
    return {
      tasksCompleted: 0,
      avgTime: 0,
      successRate: 0,
      toolSelection: 'No Data',
      avgCost: 0,
    };
  }

  const totalReputation = agents.reduce((sum, agent) => sum + parseInt(agent.currentReputation), 0);
  const avgReputation = Math.floor(totalReputation / agents.length);
  const activeAgents = agents.filter(agent => parseInt(agent.currentReputation) > 85);
  
  return {
    tasksCompleted: agents.length * 10, // Mock calculation
    avgTime: Math.floor(Math.random() * 20) + 30,
    successRate: Math.min(avgReputation, 100),
    toolSelection: agents[0]?.tag.includes('Trading') ? 'DEX Trading' : 
                   agents[0]?.tag.includes('DeFi') ? 'DeFi Protocols' :
                   agents[0]?.tag.includes('Cross') ? 'Cross-Chain Bridge' : 'AI Analysis',
    avgCost: 200 + Math.floor(Math.random() * 100),
  };
};
