"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, ZoomIn, ZoomOut, Search, Filter, Info } from "lucide-react"
import { motion } from "framer-motion"

interface KnowledgeGraphPopupProps {
  onClose: () => void
}

interface Node {
  id: string
  label: string
  type: string
  size: number
  x?: number
  y?: number
}

interface Edge {
  source: string
  target: string
  label: string
}

export default function KnowledgeGraphPopup({ onClose }: KnowledgeGraphPopupProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.8) // 改为初始缩放值更小
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [activeView, setActiveView] = useState("graph")
  const [nodes, setNodes] = useState<Node[]>([]) // 使用状态存储节点

  // 知识图谱数据 - 初始节点数据
  const initialNodes = useMemo<Node[]>(() => [
    { id: "system", label: "会议室预订系统", type: "system", size: 60 },
    { id: "user", label: "用户", type: "actor", size: 40 },
    { id: "admin", label: "管理员", type: "actor", size: 40 },
    { id: "room", label: "会议室", type: "entity", size: 45 },
    { id: "booking", label: "预订功能", type: "feature", size: 50 },
    { id: "notification", label: "通知功能", type: "feature", size: 40 },
    { id: "calendar", label: "日历集成", type: "feature", size: 40 },
    { id: "conflict", label: "冲突检测", type: "feature", size: 35 },
    { id: "equipment", label: "会议设备", type: "entity", size: 30 },
    { id: "schedule", label: "日程表", type: "entity", size: 35 }
  ] as Node[], []);

  const edges: Edge[] = [
    { source: "system", target: "booking", label: "包含" },
    { source: "system", target: "notification", label: "包含" },
    { source: "system", target: "calendar", label: "集成" },
    { source: "system", target: "conflict", label: "实现" },
    { source: "user", target: "booking", label: "使用" },
    { source: "user", target: "notification", label: "接收" },
    { source: "admin", target: "booking", label: "管理" },
    { source: "admin", target: "room", label: "维护" },
    { source: "room", target: "equipment", label: "包含" },
    { source: "room", target: "booking", label: "被预订" },
    { source: "booking", target: "conflict", label: "避免" },
    { source: "booking", target: "schedule", label: "更新" },
    { source: "calendar", target: "schedule", label: "显示" }
  ]

  // 计算节点位置 (改进的力导向布局)
  useEffect(() => {
    // 获取容器尺寸来调整布局
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 600;

    // 中心点
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    // 创建节点副本计算位置
    const nodesWithPositions = [...initialNodes];

    // 系统节点放在中心
    const systemNode = nodesWithPositions.find(n => n.id === "system");
    if (systemNode) {
      systemNode.x = centerX;
      systemNode.y = centerY - 100;
    }

    // 行为者放在左侧
    const actorNodes = nodesWithPositions.filter(n => n.type === "actor");
    actorNodes.forEach((node, i) => {
      node.x = centerX - (containerWidth * 0.25);
      node.y = centerY - 50 + i * 100;
    });

    // 实体放在右侧
    const entityNodes = nodesWithPositions.filter(n => n.type === "entity");
    entityNodes.forEach((node, i) => {
      node.x = centerX + (containerWidth * 0.25);
      node.y = centerY - 80 + i * 80;
    });

    // 功能放在下方
    const featureNodes = nodesWithPositions.filter(n => n.type === "feature");
    featureNodes.forEach((node, i) => {
      const angle = Math.PI * (0.2 + 0.6 * i / (featureNodes.length - 1));
      const radius = containerHeight * 0.25;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + 100 + Math.sin(angle) * (radius / 2);
    });

    // 更新节点状态
    setNodes(nodesWithPositions);
  }, [initialNodes]); // 当容器大小可用时计算

  // 处理缩放
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2.5))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5))
  }

  // 处理拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 重置视图
  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedNode(null)
  }

  // 获取节点相关的边
  const getRelatedEdges = (nodeId: string) => {
    return edges.filter(edge => edge.source === nodeId || edge.target === nodeId)
  }

  // 获取节点颜色
  const getNodeColor = (type: string, isSelected: boolean): string => {
    if (isSelected) return '#3b82f6'
    switch (type) {
      case 'system': return '#3b82f6'  // 蓝色
      case 'actor': return '#22c55e'   // 绿色
      case 'entity': return '#6366f1'  // 靛蓝色
      case 'feature': return '#a855f7' // 紫色
      default: return '#94a3b8'
    }
  }

  // 检查边是否与所选节点相关
  const isEdgeHighlighted = (edge: Edge): boolean => {
    if (!selectedNode) return false
    return edge.source === selectedNode || edge.target === selectedNode
  }

  // 渲染相关知识资产
  const renderRelatedKnowledge = (nodeId: string) => {
    switch (nodeId) {
      case 'system':
        return [
          { title: 'IEEE 29148 系统需求规范', type: 'standard' },
          { title: '会议室系统架构图', type: 'diagram' }
        ]
      case 'user':
        return [
          { title: '用户角色定义文档', type: 'document' },
          { title: '用户访谈记录', type: 'recording' }
        ]
      case 'booking':
        return [
          { title: '预订流程图', type: 'diagram' },
          { title: '现有系统预订功能截图', type: 'image' }
        ]
      case 'room':
        return [
          { title: '会议室管理规范', type: 'document' },
          { title: '设备清单', type: 'spreadsheet' }
        ]
      case 'conflict':
        return [
          { title: '冲突检测算法设计', type: 'document' }
        ]
      default:
        return []
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl bg-white shadow-2xl rounded-lg h-[85vh] flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
          <div className="flex items-center">
            <CardTitle className="text-lg font-semibold text-gray-800">知识图谱浏览器</CardTitle>
            <Badge className="ml-2 bg-blue-50 text-blue-700 border-blue-200 text-xs">
              会议室预订系统
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        </CardHeader>

        <Tabs value={activeView} onValueChange={setActiveView} className="flex-1 flex flex-col">
          <div className="border-b px-4 py-2 flex justify-between items-center">
            <TabsList className="h-8">
              <TabsTrigger value="graph" className="text-xs px-3 py-1.5">图谱视图</TabsTrigger>
              <TabsTrigger value="list" className="text-xs px-3 py-1.5">列表视图</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={resetView}>
                重置视图
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <TabsContent value="graph" className="flex-1 relative p-0 m-0 overflow-hidden">
            {/* 图例 */}
            <div className="absolute top-3 left-3 z-10 bg-white bg-opacity-90 p-2 rounded-md shadow-sm text-xs">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] mr-1.5"></span>系统</div>
                <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] mr-1.5"></span>角色</div>
                <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] mr-1.5"></span>实体</div>
                <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-[#a855f7] mr-1.5"></span>功能</div>
              </div>
              <div className="text-gray-500 italic text-[10px] mt-1">点击节点可查看关系</div>
            </div>

            {/* 图谱容器 */}
            <div
              ref={containerRef}
              className="w-full h-full cursor-grab active:cursor-grabbing bg-gray-50"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {nodes.length > 0 ? (
                <div style={{
                  transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                  transformOrigin: 'center',
                  width: '100%',
                  height: '100%',
                  position: 'relative'
                }}>
                  {/* 渲染边 */}
                  <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                    {edges.map((edge, i) => {
                      const sourceNode = nodes.find(n => n.id === edge.source);
                      const targetNode = nodes.find(n => n.id === edge.target);

                      if (!sourceNode?.x || !targetNode?.x) return null;
                      if (!sourceNode?.y || !targetNode?.y) return null;

                      const isHighlighted = isEdgeHighlighted(edge);
                      const midX = (sourceNode.x + targetNode.x) / 2;
                      const midY = (sourceNode.y + targetNode.y) / 2;

                      return (
                        <g key={`edge-${i}`}>
                          <line
                            x1={sourceNode.x}
                            y1={sourceNode.y}
                            x2={targetNode.x}
                            y2={targetNode.y}
                            stroke={isHighlighted ? "#3b82f6" : "#cbd5e1"}
                            strokeWidth={isHighlighted ? 2 : 1}
                            strokeDasharray={isHighlighted ? "none" : "4,2"}
                          />
                          {isHighlighted && (
                            <text
                              x={midX}
                              y={midY}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#64748b"
                              fontSize="12px"
                              className="bg-white px-1"
                            >
                              <tspan className="bg-white py-0.5 px-1">{edge.label}</tspan>
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* 渲染节点 */}
                  {nodes.map(node => {
                    if (!node.x) return null;
                    if (!node.y) return null;

                    const isSelected = selectedNode === node.id;
                    const nodeColor = getNodeColor(node.type, isSelected);

                    return (
                      <motion.div
                        key={node.id}
                        className="absolute flex items-center justify-center rounded-full cursor-pointer shadow-md"
                        style={{
                          left: node.x - node.size/2,
                          top: node.y - node.size/2,
                          width: node.size,
                          height: node.size,
                          backgroundColor: nodeColor,
                          border: isSelected ? "2px solid #1d4ed8" : "none",
                          zIndex: isSelected ? 10 : 1,
                        }}
                        whileHover={{ scale: 1.1 }}
                        onClick={() => setSelectedNode(isSelected ? null : node.id)}
                      >
                        <div className="absolute whitespace-nowrap text-xs font-medium text-center" style={{
                          width: 'auto',
                          bottom: node.type === 'system' ? -28 : 0,
                          top: node.type !== 'system' ? node.size + 5 : 0,
                          color: "#334155",
                        }}>
                          {node.label}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">加载知识图谱中...</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="list" className="flex-1 p-4 m-0 overflow-auto">
            <div className="flex mb-3">
              <div className="relative rounded-md shadow-sm flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="搜索知识图谱元素..."
                />
              </div>
              <Button variant="outline" className="ml-2">
                <Filter className="h-4 w-4 mr-1" />
                筛选
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.entries({
                '系统': nodes.filter(n => n.type === 'system'),
                '角色': nodes.filter(n => n.type === 'actor'),
                '实体': nodes.filter(n => n.type === 'entity'),
                '功能': nodes.filter(n => n.type === 'feature')
              }).map(([category, categoryNodes]) => (
                <div key={category} className="border rounded-md p-3">
                  <h3 className="font-medium text-sm mb-2">{category}</h3>
                  <div className="space-y-2">
                    {categoryNodes.map(node => (
                      <div
                        key={node.id}
                        className={`p-2 rounded flex items-center cursor-pointer ${selectedNode === node.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                        onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                      >
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getNodeColor(node.type, false) }}></div>
                        <span className="text-sm">{node.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* 详情侧边栏 */}
        {selectedNode && (
          <div className="w-72 border-l bg-gray-50 p-4">
            <h3 className="font-semibold text-sm mb-1">
              {nodes.find(n => n.id === selectedNode)?.label}
            </h3>
            <Badge className="mb-3">
              {{
                'system': '系统',
                'actor': '角色',
                'entity': '实体',
                'feature': '功能'
              }[nodes.find(n => n.id === selectedNode)?.type || '']}
            </Badge>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  相关元素
                </h4>
                <div className="space-y-1.5">
                  {getRelatedEdges(selectedNode).map((edge, idx) => {
                    const isSource = edge.source === selectedNode;
                    const relatedNodeId = isSource ? edge.target : edge.source;
                    const relatedNode = nodes.find(n => n.id === relatedNodeId);

                    return (
                      <div key={idx} className="flex items-center text-xs bg-white p-1.5 rounded border">
                        <span
                          className="w-2 h-2 rounded-full mr-1.5"
                          style={{ backgroundColor: getNodeColor(relatedNode?.type || '', false) }}
                        />
                        <span className="text-gray-800">
                          {relatedNode?.label}
                        </span>
                        <span className="mx-1 text-gray-400 text-[10px]">
                          {isSource ? `→ ${edge.label}` : `← ${edge.label}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">相关知识资产</h4>
                <div className="space-y-1.5">
                  {renderRelatedKnowledge(selectedNode).map((item, i) => (
                    <div key={i} className="text-xs bg-white p-1.5 rounded border flex items-center">
                      <span className="text-blue-600 underline cursor-pointer">{item.title}</span>
                      <Badge variant="outline" className="ml-auto text-[10px] bg-gray-50">
                        {item.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
