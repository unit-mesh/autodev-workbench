"use client"

import { useEffect, useState } from "react"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import Graph from "react-graph-vis"
import "vis-network/styles/vis-network.min.css"
import { X, Info } from "lucide-react"
import { motion } from "framer-motion"

interface KnowledgeGraphPopupProps {
  onClose: () => void
}

interface DictionaryItem {
  id: string
  term: string
  definition: string
  category: string
  relatedTerms: string[]
}

// Updated data structure for react-graph-vis
interface VisNode {
  id: string;
  label: string;
  group?: string; // Category for coloring
  title?: string; // Tooltip on hover
  originalItem: DictionaryItem; // Store the full original item
}

interface VisEdge {
  from: string;
  to: string;
}

interface GraphDataType {
  nodes: VisNode[];
  edges: VisEdge[];
}

export default function KnowledgeGraphPopup({ onClose }: KnowledgeGraphPopupProps) {
  const [, setDictionaryItems] = useState<DictionaryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<GraphDataType>({ nodes: [], edges: [] })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedNode, setSelectedNode] = useState<any>(null)
  // const [zoom, setZoom] = useState(1) // Removed
  // const graphRef = useRef<any>(null) // Removed

  useEffect(() => {
    const fetchDictionary = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/concepts/dict')
        if (!response.ok) {
          throw new Error('获取数据失败')
        }
        const data = await response.json()
        setDictionaryItems(data)
        prepareGraphData(data)
      } catch (err) {
        setError((err as Error).message)
        console.error('获取词典数据失败:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDictionary()
  }, [])

  const prepareGraphData = (items: DictionaryItem[]) => {
    // 创建节点
    const nodes: VisNode[] = items.map(item => ({
      id: item.id,
      label: item.term,
      group: item.category, // Used for coloring by 'groups' option in react-graph-vis
      title: item.definition, // Tooltip on hover
      originalItem: item // Store full item for details panel
    }))

    // 创建连接
    const edges: VisEdge[] = []

    items.forEach(item => {
      if (item.relatedTerms && Array.isArray(item.relatedTerms)) {
        item.relatedTerms.forEach(relatedTerm => {
          const targetNode = items.find(i => i.term === relatedTerm)
          if (targetNode) {
            edges.push({
              from: item.id, // react-graph-vis uses 'from'
              to: targetNode.id // react-graph-vis uses 'to'
            })
          }
        })
      }
    })

    setGraphData({ nodes, edges }) // Changed 'links' to 'edges'
  }

  // react-graph-vis options
  const graphOptions = {
    layout: {
      hierarchical: false,
    },
    edges: {
      color: "#cccccc",
      arrows: {
        to: { enabled: true, scaleFactor: 0.5 }
      },
      width: 1.5,
    },
    nodes: {
      shape: "dot",
      size: 16, // Corresponds to nodeRelSize
      font: {
        size: 14,
        color: "#333333"
      }
    },
    physics: {
      enabled: true,
      barnesHut: {
        gravitationalConstant: -15000,
        centralGravity: 0.2,
        springLength: 120,
        springConstant: 0.05,
        damping: 0.09,
        avoidOverlap: 0.15
      },
      solver: 'barnesHut',
      stabilization: {
        iterations: 150, // Similar to cooldownTicks
        fit: true,
      }
    },
    interaction: {
      tooltipDelay: 200,
      hover: true,
      navigationButtons: false, // Set to true to show default zoom buttons
      zoomView: true,
      dragView: true,
    },
    height: "100%",
    width: "100%",
    groups: { // Define colors for categories
      "通用": { color: "#4299e1", shape: "ellipse" },
      "技术": { color: "#48bb78", shape: "ellipse" },
      "业务": { color: "#f6ad55", shape: "ellipse" },
      "框架": { color: "#9f7aea", shape: "ellipse" },
      "方法论": { color: "#fc8181", shape: "ellipse" },
      "default": { color: "#999999", shape: "ellipse" }
    }
  };

  const graphEvents = {
    selectNode: ({ nodes: selectedNodeIds }: { nodes: string[] }) => {
      if (selectedNodeIds && selectedNodeIds.length > 0) {
        const nodeId = selectedNodeIds[0];
        const clickedNodeData = graphData.nodes.find(n => n.id === nodeId);
        if (clickedNodeData && clickedNodeData.originalItem) {
          const item = clickedNodeData.originalItem;
          setSelectedNode({
            id: item.id,
            name: item.term,
            category: item.category,
            item: item
          });
        } else {
          setSelectedNode(null);
        }
      } else {
        setSelectedNode(null);
      }
    },
    deselectNode: () => {
      setSelectedNode(null);
    }
  };

  // Removed handleNodeClick, handleZoomIn, handleZoomOut

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-center mt-4">加载知识图谱中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-red-500">错误</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <p>{error}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-full"
          >
            关闭
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl flex flex-col w-[90vw] h-[85vh] relative"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">知识图谱浏览</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 relative w-full h-full"> {/* Ensure container takes full space */}
          {graphData.nodes.length > 0 ? (
            <Graph
              graph={graphData} // Pass nodes and edges
              options={graphOptions}
              events={graphEvents}
              style={{ width: "100%", height: "100%" }} // Ensure graph fills container
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500">无数据可显示</p>
            </div>
          )}

          {/* Removed custom zoom buttons */}
          {/* <div className="absolute bottom-4 right-4 flex flex-col gap-2"> ... </div> */}
        </div>

        {selectedNode && (
          <div className="absolute left-4 bottom-4 bg-white p-4 rounded-lg shadow-lg max-w-md border">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Info size={16} />
                <h3 className="font-bold text-lg">{selectedNode.name}</h3>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                {selectedNode.category}
              </span>
            </div>
            <p className="text-sm text-gray-700">{selectedNode.item?.definition}</p>
            {selectedNode.item?.relatedTerms?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">相关术语:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.item.relatedTerms.map((term: string) => (
                    <span key={term} className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
