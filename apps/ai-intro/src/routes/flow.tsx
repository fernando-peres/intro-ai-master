import { createFileRoute } from "@tanstack/react-router"
import {
  addEdge,
  Background,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react"
import { useCallback } from "react"

export const Route = createFileRoute("/flow")({ component: FlowPage })

const initialNodes: Node[] = [
  { id: "data", position: { x: 0, y: 0 }, data: { label: "Data" } },
  { id: "model", position: { x: 200, y: 100 }, data: { label: "Model" } },
  { id: "prediction", position: { x: 400, y: 200 }, data: { label: "Prediction" } },
]

const initialEdges: Edge[] = [
  { id: "data-model", source: "data", target: "model", animated: true },
  { id: "model-prediction", source: "model", target: "prediction" },
]

function FlowPage() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const onConnect = useCallback(
    (connection: Connection) => setEdges((current) => addEdge(connection, current)),
    [setEdges],
  )

  return (
    <div className="flex-1">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
