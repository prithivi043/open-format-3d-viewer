import { useState, useMemo, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ChevronDown,
  ChevronRight,
  X,
  Search,
  Building2,
  Layers,
  DoorOpen,
  AppWindow,
  Columns3,
  Box,
} from "lucide-react";
import { useViewerStore } from "../store/viewerStore";
import type { IFCNode } from "../types/viewer.types";

interface FlattenedNode {
  id: string;
  name: string;
  type: string;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  rawNode: IFCNode;
}

function getNodeIcon(type: string) {
  if (type === "IfcBuilding")
    return <Building2 size={13} className="text-blue-400" />;
  if (type === "IfcBuildingStorey")
    return <Layers size={13} className="text-cyan-400" />;
  if (type === "IfcDoor")
    return <DoorOpen size={13} className="text-amber-400" />;
  if (type === "IfcWindow")
    return <AppWindow size={13} className="text-sky-400" />;
  if (type === "IfcColumn")
    return <Columns3 size={13} className="text-orange-400" />;
  if (type === "IfcSite" || type === "IfcProject")
    return <Box size={13} className="text-emerald-400" />;
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect
        x="1"
        y="4"
        width="11"
        height="8"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        className="text-violet-400"
        fill="none"
      />
      <rect
        x="4"
        y="1"
        width="5"
        height="4"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        className="text-violet-400"
        fill="none"
      />
    </svg>
  );
}

function flattenTree(
  nodes: IFCNode[],
  expandedNodes: Set<string>,
  depth = 0,
): FlattenedNode[] {
  const result: FlattenedNode[] = [];
  for (const node of nodes) {
    const hasChildren = !!node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    result.push({
      id: node.id,
      name: node.name,
      type: node.type,
      depth,
      hasChildren,
      isExpanded,
      rawNode: node,
    });
    if (hasChildren && isExpanded) {
      result.push(...flattenTree(node.children!, expandedNodes, depth + 1));
    }
  }
  return result;
}

export function ModelTree() {
  const {
    isModelTreeOpen,
    toggleModelTree,
    modelTree,
    expandedNodes,
    toggleNodeExpanded,
    selectedObjectId,
    setSelectedObjectId,
  } = useViewerStore();
  const [search, setSearch] = useState("");
  const parentRef = useRef<HTMLDivElement | null>(null);

  const filterTree = useCallback((nodes: IFCNode[], q: string): IFCNode[] => {
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
  }, []);

  const filteredTree = useMemo(
    () => filterTree(modelTree, search),
    [modelTree, search, filterTree],
  );

  const flattenedList = useMemo(
    () => flattenTree(filteredTree, expandedNodes),
    [filteredTree, expandedNodes],
  );

  const rowVirtualizer = useVirtualizer({
    count: flattenedList.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 15,
  });

  if (!isModelTreeOpen) {
    return (
      <button
        onClick={toggleModelTree}
        className="absolute left-3 top-16 z-10 px-3 py-1.5 rounded text-xs text-gray-400 hover:text-white transition-colors"
        style={{
          background: "rgba(8,10,26,0.85)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        Model Tree
      </button>
    );
  }

  const isEmpty = flattenedList.length === 0;

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
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <span className="text-[12px] font-semibold text-white tracking-wide">
          Model tree
        </span>
        <button
          onClick={toggleModelTree}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Search */}
      <div
        className="px-2 py-2 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <Search size={11} className="text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="bg-transparent text-[11px] text-white placeholder-gray-500 outline-none w-full"
          />
        </div>
      </div>

      {/* Virtualized Tree List */}
      <div
        ref={parentRef}
        className="overflow-y-auto py-1 custom-scroll flex-1 relative"
        style={{ height: "400px", maxHeight: "calc(100vh - 220px)" }}
      >
        {isEmpty && (
          <p className="text-[11px] text-gray-500 text-center py-6 px-3">
            {modelTree.length === 0
              ? "Model tree will appear after loading"
              : "No results found"}
          </p>
        )}

        {!isEmpty && (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = flattenedList[virtualRow.index];
              if (!item) return null;
              const isSelected = selectedObjectId === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    className={`flex items-center gap-1.5 py-[3px] pr-2 rounded cursor-pointer select-none transition-colors group h-full
                      ${
                        isSelected
                          ? "bg-violet-600/25 text-white"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }`}
                    style={{ paddingLeft: `${8 + item.depth * 14}px` }}
                    onClick={() => {
                      if (item.hasChildren) toggleNodeExpanded(item.id);
                      setSelectedObjectId(item.id);
                    }}
                  >
                    <span className="flex-shrink-0 w-3.5">
                      {item.hasChildren ? (
                        item.isExpanded ? (
                          <ChevronDown
                            size={12}
                            className="text-gray-500 group-hover:text-gray-300"
                          />
                        ) : (
                          <ChevronRight
                            size={12}
                            className="text-gray-500 group-hover:text-gray-300"
                          />
                        )
                      ) : null}
                    </span>
                    <span className="flex-shrink-0">
                      {getNodeIcon(item.type)}
                    </span>
                    <span className="text-[12px] truncate">{item.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
