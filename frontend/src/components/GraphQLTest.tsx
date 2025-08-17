'use client';

import { useSubgraphData } from '@/hooks/useSubgraphData';

export default function GraphQLTest() {
  const { data, isLoading, error } = useSubgraphData();

  if (isLoading) {
    return (
      <div className="p-4 bg-black/60 border border-yellow-400/30 rounded">
        <div className="text-yellow-400 font-mono text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          Loading subgraph data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-black/60 border border-red-400/30 rounded">
        <div className="text-red-400 font-mono text-sm">
          <strong>GraphQL Error:</strong> {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-black/60 border border-green-400/30 rounded">
      <div className="text-green-400 font-mono text-sm">
        <strong>✅ Subgraph Connection Success!</strong><br/>
        <strong>Agents:</strong> {data?.agents?.length || 0}<br/>
        <strong>Transactions:</strong> {data?.transactions?.length || 0}<br/>
        {data?.agents?.[0] && (
          <div className="mt-2 text-white">
            <strong>Top Agent:</strong> {data.agents[0].tag} (Reputation: {data.agents[0].currentReputation}/100)
          </div>
        )}
      </div>
    </div>
  );
}
