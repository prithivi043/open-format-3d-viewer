import { useState } from "react";
import { ChevronDown, ChevronRight, X, Search, Building2, Layers, DoorOpen, AppWindow, Columns3 } from "lucide-react";
import { useViewerStore } from "../store/viewerStore";
import type { IFCNode } from "../types/viewer.types";

const MOCK_TREE: IFCNode[] = [
  {
    id: "building",
    name: "Building",
    type: "IfcBuilding",
    children: [
      {
        id: "level3",
        name: "Level 3",
        type: "IfcBuildingStorey",
        children: [],
      },
      {
        id: "level2",
        name: "Level 2",
        type: "IfcBuildingStorey",
        children: [],
      },
      {
        id: "level1",
        name: "Level 1",
        type: "IfcBuildingStorey",
        children: [
          { id: "walls", name: "Walls", type: "IfcWall", children: [], objectId: "walls-group" },
          { id: "doors", name: "Doors", type: "IfcDoor", children: [], objectId: "doors-group" },
          { id: "windows", name: "Windows", type: "IfcWindow", children: [], objectId: "windows-group" },
          { id: "columns", name: "Columns", type: "IfcColumn", children: [], objectId: "columns-group" },
        ],
      },
    ],
  },
  {
    id: "site",
    name: "Site",
    type: "IfcSite",
    children: [],
  },
];

function getNodeIcon(type: string) {
  if (type === "IfcBuilding") return <Building2 size={13} className="text-blue-400" />;
  if (type === "IfcBuildingStorey") return <Layers size={13} className="text-cyan-400" />;
  if (type === "IfcDoor") return <DoorOpen size={13} className="text-amber-400" />;
  if (type === "IfcWindow") return <AppWindow size={13} className="text-sky-400" />;
  if (type === "IfcColumn") return <Columns3 size={13} className="text-orange-400" />;
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="1" y="4" width="11" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" className="text-violet-400" fill="none"/>
      <rect x="4" y="1" width="5" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" className="text-violet-400" fill="none"/>
    </svg>
  );
}

interface TreeNodeProps {
  node: IFCNode;
  depth: number;
}

function TreeNode({ node, depth }: TreeNodeProps) {
  const { expandedNodes, toggleNodeExpanded, selectedObjectId, setSelectedObjectId } = useViewerStore();
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedObjectId === node.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-[3px] pr-2 rounded cursor-pointer select-none transition-colors group
          ${isSelected ? "bg-violet-600/25 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => {
          if (hasChildren) toggleNodeExpanded(node.id);
          setSelectedObjectId(node.id);
        }}
      >
        <span className="flex-shrink-0 w-3.5">
          {hasChildren ? (
            isExpanded
              ? <ChevronDown size={12} className="text-gray-500 group-hover:text-gray-300" />
              : <ChevronRight size={12} className="text-gray-500 group-hover:text-gray-300" />
          ) : null}
        </span>
        <span className="flex-shrink-0">{getNodeIcon(node.type)}</span>
        <span className="text-[12px] truncate">{node.name}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ModelTree() {
  const { isModelTreeOpen, toggleModelTree } = useViewerStore();
  const [search, setSearch] = useState("");

  if (!isModelTreeOpen) {
    return (
      <button
        onClick={toggleModelTree}
        className="absolute left-3 top-16 z-10 px-3 py-1.5 rounded text-xs text-gray-400 hover:text-white transition-colors"
        style={{ background: "rgba(8,10,26,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        Model Tree
      </button>
    );
  }

  const filterTree = (nodes: IFCNode[], q: string): IFCNode[] => {
    if (!q) return nodes;
    return nodes
      .map((n) => ({
        ...n,
        children: filterTree(n.children ?? [], q),
      }))
      .filter(
        (n) =>
          n.name.toLowerCase().includes(q.toLowerCase()) ||
          (n.children ?? []).length > 0,
      );
  };

  const filteredTree = filterTree(MOCK_TREE, search);

  return (
    <div
      className="absolute left-3 top-14 z-10 flex flex-col w-[200px]"
      style={{
        background: "rgba(8,10,26,0.92)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "6px",
        backdropFilter: "blur(12px)",
        maxHeight: "calc(100vh - 100px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span className="text-[12px] font-semibold text-white tracking-wide">Model tree</span>
        <button onClick={toggleModelTree} className="text-gray-500 hover:text-white transition-colors">
          <X size={13} />
        </button>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>
          <Search size={11} className="text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="bg-transparent text-[11px] text-white placeholder-gray-500 outline-none w-full"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="overflow-y-auto py-1 custom-scroll flex-1">
        {filteredTree.map((node) => (
          <TreeNode key={node.id} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}
