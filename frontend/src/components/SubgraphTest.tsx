'use client';

import { useSubgraphData } from '@/hooks/useSubgraphData';

export default function SubgraphTest() {
  const { data, isLoading, error } = useSubgraphData();

  if (isLoading) return <div className="text-yellow-400">Loading subgraph data...</div>;
  if (error) return <div className="text-red-400">Error: {error.message}</div>;

  return (
    <div className="p-4 bg-black/40 rounded border border-gray-600/30 text-white font-mono text-xs">
      <h3 className="text-green-400 mb-2">SUBGRAPH DATA TEST</h3>
      <div>
        <strong>Agents:</strong> {data?.agents?.length || 0}<br/>
        <strong>Transactions:</strong> {data?.transactions?.length || 0}<br/>
        {data?.agents?.[0] && (
          <div className="mt-2">
            <strong>Top Agent:</strong> {data.agents[0].tag} (Rep: {data.agents[0].currentReputation})
          </div>
        )}
      </div>
    </div>
  );
}
