import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Network,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  ChevronRight,
  ChevronDown,
  User as UserIcon,
  Award,
  DollarSign,
  Users as UsersIcon,
  Sparkles,
  Info,
  Maximize2,
  X,
  LayoutList,
  GitPullRequest
} from 'lucide-react';
import { User as UserType } from '../types';

interface NetworkTreeViewProps {
  currentUser: UserType;
  users: Record<number, UserType>;
  lang: string;
}

interface TreeNodeData {
  id: number;
  referrerId: number | null;
  totalIncome: number;
  downlinesCount: number;
  planLevel: number;
  plans: UserType['plans'];
  depth: number;
  children?: TreeNodeData[];
  _children?: TreeNodeData[]; // Cached for collapsing
}

export const NetworkTreeView: React.FC<NetworkTreeViewProps> = ({
  currentUser,
  users,
  lang
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewMode, setViewMode] = useState<'canvas' | 'nested'>('canvas');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('vertical');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRankFilter, setSelectedRankFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<UserType | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(new Set());
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Labels dictionary for multi-language support
  const labels: Record<string, Record<string, string>> = {
    title: {
      TH: 'แผนภูมิเครือข่ายผังองค์กร (Network Downline Tree Map)',
      EN: 'Downline Network Tree Map',
      ZH: '下线网络树状图'
    },
    subtitle: {
      TH: 'แสดงโครงสร้างสายงานและแผน Rank ที่เปิดใช้งานของสมาชิกทั้งหมดภายใต้ ID ของคุณ',
      EN: 'Visualize downline structure and active Ranks under your account',
      ZH: '可视化您账户下的下线结构和激活的 Rank'
    },
    searchPlaceholder: {
      TH: 'ค้นหา ID สมาชิก...',
      EN: 'Search Member ID...',
      ZH: '搜索会员 ID...'
    },
    filterRank: {
      TH: 'กรองตาม Rank',
      EN: 'Filter by Rank',
      ZH: '按 Rank 筛选'
    },
    allRanks: {
      TH: 'ทุก Rank',
      EN: 'All Ranks',
      ZH: '所有 Rank'
    },
    orientationHorizontal: {
      TH: 'แนวนอน (ซ้ายไปขวา)',
      EN: 'Horizontal (L -> R)',
      ZH: '水平 (左至右)'
    },
    orientationVertical: {
      TH: 'แนวตั้ง (บนลงล่าง)',
      EN: 'Vertical (T -> B)',
      ZH: '垂直 (上至下)'
    },
    viewCanvas: {
      TH: 'แผนภูมิ D3 Tree',
      EN: 'D3 Tree Visualizer',
      ZH: 'D3 树状图'
    },
    viewNested: {
      TH: 'ผังรายการลำดับชั้น',
      EN: 'Nested List Directory',
      ZH: '嵌套列表目录'
    },
    totalMembers: {
      TH: 'สมาชิกในสายงานทั้งหมด',
      EN: 'Total Downline Members',
      ZH: '团队下线总数'
    },
    youLabel: {
      TH: '(บัญชีคุณ)',
      EN: '(Your ID)',
      ZH: '(您的账户)'
    },
    expandAll: {
      TH: 'ขยายทั้งหมด',
      EN: 'Expand All',
      ZH: '展开全部'
    },
    collapseAll: {
      TH: 'ย่อทั้งหมด',
      EN: 'Collapse All',
      ZH: '折叠全部'
    },
    resetZoom: {
      TH: 'รีเซ็ตมุมมอง',
      EN: 'Reset Zoom',
      ZH: '重置视角'
    },
    memberDetails: {
      TH: 'รายละเอียดสมาชิก',
      EN: 'Member Details',
      ZH: '会员详情'
    },
    sponsorId: {
      TH: 'ผู้แนะนำ (Sponsor ID)',
      EN: 'Sponsor ID',
      ZH: '推荐人 ID'
    },
    directReferrals: {
      TH: 'ลูกทีมตรง (Directs)',
      EN: 'Direct Referrals',
      ZH: '直推人数'
    },
    activeRanks: {
      TH: 'Rank ที่เปิดใช้งาน',
      EN: 'Active Ranks',
      ZH: '已激活的 Rank'
    },
    close: {
      TH: 'ปิด',
      EN: 'Close',
      ZH: '关闭'
    }
  };

  const getText = (key: string) => {
    return labels[key]?.[lang] || labels[key]?.['TH'] || labels[key]?.['EN'] || key;
  };

  // Build recursive tree data rooted at currentUser
  const rawTreeData = useMemo(() => {
    const buildTree = (userId: number, depth = 0): TreeNodeData | null => {
      const u = users[userId];
      if (!u) return null;

      // Find direct children (users whose referrerId === userId)
      const directChildren = (Object.values(users) as UserType[])
        .filter(child => child.referrerId === userId && child.id !== userId)
        .sort((a, b) => a.id - b.id);

      const childrenNodes: TreeNodeData[] = directChildren
        .map(child => buildTree(child.id, depth + 1))
        .filter((node): node is TreeNodeData => node !== null);

      return {
        id: u.id,
        referrerId: u.referrerId,
        totalIncome: u.totalIncome,
        downlinesCount: u.downlinesCount,
        planLevel: u.planLevel,
        plans: u.plans,
        depth,
        children: childrenNodes.length > 0 ? childrenNodes : undefined
      };
    };

    return buildTree(currentUser.id, 0);
  }, [currentUser.id, users]);

  // Apply collapsed nodes filtering
  const treeData = useMemo(() => {
    if (!rawTreeData) return null;

    const applyCollapse = (node: TreeNodeData): TreeNodeData => {
      const isCollapsed = collapsedNodes.has(node.id);
      if (!node.children || node.children.length === 0) {
        return { ...node };
      }

      if (isCollapsed) {
        return {
          ...node,
          _children: node.children.map(applyCollapse),
          children: undefined
        };
      }

      return {
        ...node,
        children: node.children.map(applyCollapse)
      };
    };

    return applyCollapse(rawTreeData);
  }, [rawTreeData, collapsedNodes]);

  // Total members count in downline tree
  const totalDownlineCount = useMemo(() => {
    if (!rawTreeData) return 0;
    let count = 0;
    const traverse = (node: TreeNodeData) => {
      count++;
      if (node.children) node.children.forEach(traverse);
      if (node._children) node._children.forEach(traverse);
    };
    traverse(rawTreeData);
    return count - 1; // Exclude root user itself
  }, [rawTreeData]);

  // Expand / Collapse All handlers
  const handleExpandAll = () => {
    setCollapsedNodes(new Set());
  };

  const handleCollapseAll = () => {
    if (!rawTreeData) return;
    const allIds = new Set<number>();
    const collectIds = (node: TreeNodeData) => {
      if (node.children && node.children.length > 0) {
        if (node.id !== currentUser.id) {
          allIds.add(node.id);
        }
        node.children.forEach(collectIds);
      }
    };
    collectIds(rawTreeData);
    setCollapsedNodes(allIds);
  };

  const toggleNodeCollapse = (id: number) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Render D3 Tree SVG whenever treeData, orientation, searchQuery, or selectedRankFilter changes
  useEffect(() => {
    if (viewMode !== 'canvas' || !svgRef.current || !treeData || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = Math.max(500, window.innerHeight * 0.6);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing

    // Setup main container group for Zooming
    const gContainer = svg.append('g').attr('class', 'tree-viewport');

    // Create D3 hierarchy
    const root = d3.hierarchy<TreeNodeData>(treeData);

    // Node card dimensions
    const nodeWidth = 180;
    const nodeHeight = 85;

    // Define tree layout according to orientation
    let treeLayout: d3.TreeLayout<TreeNodeData>;
    if (orientation === 'horizontal') {
      treeLayout = d3.tree<TreeNodeData>().nodeSize([nodeHeight + 25, nodeWidth + 60]);
    } else {
      treeLayout = d3.tree<TreeNodeData>().nodeSize([nodeWidth + 30, nodeHeight + 50]);
    }

    treeLayout(root);

    // Center root initially
    const initialX = orientation === 'horizontal' ? 80 : width / 2;
    const initialY = orientation === 'horizontal' ? height / 2 : 60;

    // Setup D3 Zoom
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 2.5])
      .on('zoom', (event) => {
        gContainer.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoomBehavior as any);
    svg.call(
      zoomBehavior.transform as any,
      d3.zoomIdentity.translate(initialX, initialY).scale(0.85)
    );

    // Links Generator
    const linkGenerator = (d: any) => {
      if (orientation === 'horizontal') {
        const sourceX = d.source.y + nodeWidth;
        const sourceY = d.source.x + nodeHeight / 2;
        const targetX = d.target.y;
        const targetY = d.target.x + nodeHeight / 2;
        return `M ${sourceX} ${sourceY} C ${(sourceX + targetX) / 2} ${sourceY}, ${(sourceX + targetX) / 2} ${targetY}, ${targetX} ${targetY}`;
      } else {
        const sourceX = d.source.x + nodeWidth / 2;
        const sourceY = d.source.y + nodeHeight;
        const targetX = d.target.x + nodeWidth / 2;
        const targetY = d.target.y;
        return `M ${sourceX} ${sourceY} C ${sourceX} ${(sourceY + targetY) / 2}, ${targetX} ${(sourceY + targetY) / 2}, ${targetX} ${targetY}`;
      }
    };

    // Draw Links
    gContainer
      .append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(root.links())
      .enter()
      .append('path')
      .attr('d', linkGenerator as any)
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        const targetNode = d.target.data;
        const matchesRank =
          selectedRankFilter === 'all' ||
          Boolean(targetNode.plans[selectedRankFilter]?.active);
        return matchesRank ? '#06b6d4' : '#334155';
      })
      .attr('stroke-width', (d) => {
        const isSelectedSearch =
          searchQuery.trim() !== '' &&
          String(d.target.data.id).includes(searchQuery.trim());
        return isSelectedSearch ? 3 : 2;
      })
      .attr('stroke-dasharray', (d) => (d.target.data.depth > 1 ? '4 2' : 'none'))
      .attr('opacity', 0.8);

    // Nodes Group
    const nodeGroup = gContainer
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('transform', (d: any) => {
        return orientation === 'horizontal'
          ? `translate(${d.y},${d.x})`
          : `translate(${d.x},${d.y})`;
      })
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        const userObj = users[d.data.id];
        if (userObj) {
          setSelectedMember(userObj);
        }
      });

    // ForeignObject Cards for rich HTML/Tailwind node rendering
    const foreignObjects = nodeGroup
      .append('foreignObject')
      .attr('width', nodeWidth)
      .attr('height', nodeHeight + 20)
      .attr('x', 0)
      .attr('y', 0);

    foreignObjects.each(function (d) {
      const el = d3.select(this);
      const isRoot = d.data.id === currentUser.id;
      const isSearchMatch =
        searchQuery.trim() !== '' &&
        String(d.data.id).includes(searchQuery.trim());
      const isRankMatched =
        selectedRankFilter === 'all' ||
        Boolean(d.data.plans[selectedRankFilter]?.active);

      const activeRankCount = (Object.values(d.data.plans) as { active: boolean }[]).filter(
        (p) => p.active
      ).length;

      // Children state
      const hasChildren =
        (d.data.children && d.data.children.length > 0) ||
        (d.data._children && d.data._children.length > 0);
      const isCollapsed = collapsedNodes.has(d.data.id);

      el.html(`
        <div class="w-[180px] h-[85px] rounded-xl border p-2.5 flex flex-col justify-between transition-all duration-300 relative shadow-xl ${
          isSearchMatch
            ? 'bg-cyan-950/90 border-cyan-400 ring-2 ring-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-105 z-20'
            : isRoot
            ? 'bg-gradient-to-br from-purple-950/90 via-slate-900 to-amber-950/80 border-amber-400/80 ring-1 ring-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
            : isRankMatched
            ? 'bg-slate-900/90 border-slate-700 hover:border-cyan-500/80 hover:bg-slate-850/95'
            : 'bg-slate-950/70 border-slate-800/80 opacity-60'
        }">
          <!-- Top Row: Member ID & Badge -->
          <div class="flex items-center justify-between gap-1">
            <div class="flex items-center gap-1.5 overflow-hidden">
              <span class="w-2 h-2 rounded-full shrink-0 ${
                isRoot
                  ? 'bg-amber-400 animate-ping'
                  : isRankMatched
                  ? 'bg-emerald-400'
                  : 'bg-slate-600'
              }"></span>
              <span class="text-xs font-black font-mono tracking-tight ${
                isRoot ? 'text-amber-300 font-extrabold' : 'text-white'
              }">
                ID ${d.data.id}
              </span>
              ${
                isRoot
                  ? `<span class="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1 rounded border border-amber-500/40">YOU</span>`
                  : ''
              }
            </div>

            <div class="text-[9px] font-bold text-slate-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
              L${d.data.depth}
            </div>
          </div>

          <!-- Middle Row: Active Rank Chips -->
          <div class="flex items-center gap-1 my-1 overflow-x-auto scrollbar-none">
            ${
              activeRankCount > 0
                ? Object.entries(d.data.plans)
                    .filter(([_, p]) => p.active)
                    .slice(0, 4)
                    .map(
                      ([pId, _]) =>
                        `<span class="text-[8px] font-black px-1.2 py-0.2 rounded bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 whitespace-nowrap">R${pId}</span>`
                    )
                    .join('')
                : `<span class="text-[8px] text-slate-500 italic">No Active Rank</span>`
            }
            ${
              activeRankCount > 4
                ? `<span class="text-[8px] text-slate-400 font-mono font-bold">+${activeRankCount - 4}</span>`
                : ''
            }
          </div>

          <!-- Bottom Row: Income & Downlines count -->
          <div class="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1 font-mono">
            <span class="text-emerald-400 font-extrabold flex items-center">
              $${d.data.totalIncome}
            </span>
            <span class="text-slate-400 font-medium">
              👥 ${d.data.downlinesCount}
            </span>
          </div>

          <!-- Collapse Toggle Badge (if node has children) -->
          ${
            hasChildren
              ? `<button id="node-btn-${d.data.id}" class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-slate-800 border border-cyan-400 text-cyan-300 text-[10px] font-black flex items-center justify-center hover:bg-cyan-500 hover:text-slate-950 shadow-md cursor-pointer transition-transform hover:scale-110">
                  ${isCollapsed ? `+` : `-`}
                </button>`
              : ''
          }
        </div>
      `);

      // Bind collapse toggle button click inside node
      if (hasChildren) {
        setTimeout(() => {
          const btn = document.getElementById(`node-btn-${d.data.id}`);
          if (btn) {
            btn.onclick = (e) => {
              e.stopPropagation();
              toggleNodeCollapse(d.data.id);
            };
          }
        }, 0);
      }
    });

    // Helper zoom control handlers
    (svgRef.current as any).zoomIn = () => {
      svg.transition().duration(300).call(zoomBehavior.scaleBy as any, 1.25);
    };
    (svgRef.current as any).zoomOut = () => {
      svg.transition().duration(300).call(zoomBehavior.scaleBy as any, 0.8);
    };
    (svgRef.current as any).resetZoom = () => {
      svg
        .transition()
        .duration(400)
        .call(
          zoomBehavior.transform as any,
          d3.zoomIdentity.translate(initialX, initialY).scale(0.85)
        );
    };
  }, [
    viewMode,
    treeData,
    orientation,
    searchQuery,
    selectedRankFilter,
    collapsedNodes,
    currentUser.id,
    users
  ]);

  // Nested directory list tree recursive view component
  const NestedTreeNode: React.FC<{ node: TreeNodeData }> = ({ node }) => {
    const isRoot = node.id === currentUser.id;
    const isCollapsed = collapsedNodes.has(node.id);
    const hasChildren =
      (node.children && node.children.length > 0) ||
      (node._children && node._children.length > 0);
    const childrenList = node.children || node._children || [];

    const activeRankCount = (Object.values(node.plans) as { active: boolean }[]).filter((p) => p.active).length;
    const isSearchMatch =
      searchQuery.trim() !== '' && String(node.id).includes(searchQuery.trim());

    return (
      <div className="flex flex-col gap-1 ml-2 sm:ml-4 border-l-2 border-slate-800/80 pl-2 sm:pl-3 my-1">
        <div
          onClick={() => {
            const userObj = users[node.id];
            if (userObj) setSelectedMember(userObj);
          }}
          className={`flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
            isSearchMatch
              ? 'bg-cyan-950/80 border-cyan-400 text-white ring-1 ring-cyan-400'
              : isRoot
              ? 'bg-purple-950/40 border-amber-500/50 text-amber-200'
              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeCollapse(node.id);
                }}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 text-cyan-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
                )}
              </button>
            )}

            <div className="flex items-center gap-1.5 font-mono font-bold text-sm">
              <span className="text-white">ID {node.id}</span>
              {isRoot && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/40">
                  {getText('youLabel')}
                </span>
              )}
            </div>

            <span className="text-xs text-slate-500 font-mono">
              (L{node.depth})
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Ranks Badges */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] scrollbar-none">
              {activeRankCount > 0 ? (
                (Object.entries(node.plans) as [string, { active: boolean }][])
                  .filter(([_, p]) => p.active)
                  .map(([pId]) => (
                    <span
                      key={pId}
                      className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap"
                    >
                      Rank {pId}
                    </span>
                  ))
              ) : (
                <span className="text-[10px] text-slate-500 italic">No Active Rank</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-emerald-400 font-bold">${node.totalIncome}</span>
              <span className="text-slate-400">👥 {node.downlinesCount}</span>
            </div>
          </div>
        </div>

        {/* Render child nodes if expanded */}
        {!isCollapsed && hasChildren && (
          <div className="flex flex-col">
            {childrenList.map((child) => (
              <NestedTreeNode key={child.id} node={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-2xl relative">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-6 w-6 text-cyan-400 animate-pulse" />
            <h2 className="font-display font-extrabold text-xl text-white tracking-wide">
              {getText('title')}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {getText('subtitle')}
          </p>
        </div>

        {/* Top Summary Chips */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">
                {getText('totalMembers')}
              </span>
              <span className="text-sm font-extrabold font-mono text-cyan-300">
                {totalDownlineCount}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">Your Ranks</span>
              <span className="text-sm font-extrabold font-mono text-amber-300">
                {(Object.values(currentUser.plans) as { active: boolean }[]).filter((p) => p.active).length} / 12
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
        {/* Search & Filter Inputs */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getText('searchPlaceholder')}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Rank Filter Selector */}
          <select
            value={selectedRankFilter}
            onChange={(e) => setSelectedRankFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer font-mono"
          >
            <option value="all">{getText('allRanks')}</option>
            {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((rId) => (
              <option key={rId} value={rId}>
                Rank {rId}
              </option>
            ))}
          </select>
        </div>

        {/* View Options & Zoom Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle Button */}
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'canvas'
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              <span>{getText('viewCanvas')}</span>
            </button>
            <button
              onClick={() => setViewMode('nested')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'nested'
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>{getText('viewNested')}</span>
            </button>
          </div>

          {/* Canvas-Only Controls */}
          {viewMode === 'canvas' && (
            <>
              {/* Orientation Toggle */}
              <button
                onClick={() =>
                  setOrientation((prev) => (prev === 'vertical' ? 'horizontal' : 'vertical'))
                }
                title={
                  orientation === 'vertical'
                    ? getText('orientationHorizontal')
                    : getText('orientationVertical')
                }
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all text-xs flex items-center gap-1 cursor-pointer font-medium"
              >
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden sm:inline">
                  {orientation === 'vertical' ? 'Vertical' : 'Horizontal'}
                </span>
              </button>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => (svgRef.current as any)?.zoomIn?.()}
                  title="Zoom In"
                  className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => (svgRef.current as any)?.zoomOut?.()}
                  title="Zoom Out"
                  className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => (svgRef.current as any)?.resetZoom?.()}
                  title={getText('resetZoom')}
                  className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                </button>
              </div>
            </>
          )}

          {/* Expand / Collapse All */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleExpandAll}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 cursor-pointer transition-all"
            >
              {getText('expandAll')}
            </button>
            <button
              onClick={handleCollapseAll}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 cursor-pointer transition-all"
            >
              {getText('collapseAll')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Display Container */}
      {viewMode === 'canvas' ? (
        <div
          ref={containerRef}
          className="w-full h-[550px] bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden relative shadow-inner cursor-grab active:cursor-grabbing"
        >
          <svg ref={svgRef} className="w-full h-full" />

          {/* Canvas Floating Info Badge */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 px-2.5 py-1.5 rounded-lg backdrop-blur-md flex items-center gap-2 font-mono">
            <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>
              Drag to pan • Scroll to zoom • Click node to view details
            </span>
          </div>
        </div>
      ) : (
        /* Nested Directory List View */
        <div className="w-full max-h-[550px] overflow-y-auto bg-slate-950/80 rounded-xl border border-slate-800 p-3 scrollbar-thin scrollbar-thumb-slate-800">
          {treeData ? (
            <NestedTreeNode node={treeData} />
          ) : (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              No downline members found under your account yet.
            </div>
          )}
        </div>
      )}

      {/* Member Details Drawer / Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-cyan-500 p-0.5 flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-amber-300 font-extrabold text-sm">
                    {selectedMember.id}
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg font-mono">
                    ID {selectedMember.id}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedMember.id === currentUser.id
                      ? getText('youLabel')
                      : `Downline Member`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-0.5">
                  {getText('sponsorId')}
                </span>
                <span className="font-bold text-slate-200">
                  {selectedMember.referrerId ? `ID ${selectedMember.referrerId}` : 'Root (None)'}
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-0.5">
                  {getText('directReferrals')}
                </span>
                <span className="font-bold text-cyan-300">
                  {selectedMember.downlinesCount}
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 col-span-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Total Earnings</span>
                <span className="font-extrabold text-emerald-400 text-base">
                  ${selectedMember.totalIncome} USDT
                </span>
              </div>
            </div>

            {/* Active Ranks Status List */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-400" />
                <span>{getText('activeRanks')} (1 - 12)</span>
              </h4>

              <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((rId) => {
                  const plan = selectedMember.plans[rId];
                  const isActive = Boolean(plan?.active);
                  const matrixFill = isActive ? plan?.matrix.filter(Boolean).length : 0;

                  return (
                    <div
                      key={rId}
                      className={`p-2 rounded-lg border text-center font-mono flex flex-col items-center justify-between ${
                        isActive
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                          : 'bg-slate-950/50 border-slate-800/80 text-slate-600'
                      }`}
                    >
                      <span className="text-[10px] font-extrabold">Rank {rId}</span>
                      <span className="text-[9px] font-bold mt-1">
                        {isActive ? `Active (${matrixFill}/4)` : 'Locked'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setSelectedMember(null)}
              className="w-full mt-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs tracking-wider transition-all cursor-pointer shadow-lg"
            >
              {getText('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
