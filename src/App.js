import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, LogOut, ShieldCheck, Activity, Cpu,
  CheckCircle, Box, ListChecks, ArrowRight,
  User, Lock, LayoutDashboard, Zap, Search, ChevronRight,
  RefreshCw, ChevronLeft, Check
} from 'lucide-react';
import ParticleBackground from './ParticleBackground';

// --- 子组件：退出确认弹窗 ---
const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300 p-4">
      <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl border border-slate-100 transform animate-in zoom-in-95">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
          <LogOut size={32} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">确认退出？</h3>
        <p className="text-slate-500 mb-8 text-center">退出系统将清除当前未保存的录入数据。</p>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 transition-all">取消</button>
          <button onClick={onConfirm} className="flex-1 py-4 rounded-2xl bg-slate-900 font-bold text-white hover:bg-red-600 shadow-xl transition-all">确认</button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [riskReport, setRiskReport] = useState("等待系统扫描数据...");

  // --- 新增状态 ---
  const [genAiReport, setGenAiReport] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const [traceForm, setTraceForm] = useState({
    traceCode: '',
    traceDetail: false,
    ingreDetail: false,
    aiRisk: false
  });
  const [traceResults, setTraceResults] = useState({
    traceResult: "等待发起溯源请求...",
    aiRiskReport: "等待发起溯源请求...",
    metaIngredients: []
  });
  const [traceCollapsed, setTraceCollapsed] = useState({});
  const [tradeForm, setTradeForm] = useState({
    trade_schema: '',
    trade_product_name: '',
    trade_product_start_id: '',
    trade_product_number: '',
    buyer: '',
    buyer_addr: '',
    buyer_phone: '',
    seller: '',
    seller_addr: '',
    seller_phone: '',
    logistics_info: '',
    other_info: '',
    trade_price: ''
  });

  const [systemData, setSystemData] = useState([]);
  const [systemTotal, setSystemTotal] = useState(0);
  const [currentSystemPage, setCurrentSystemPage] = useState(0);
  const [systemProBasicOpen, setSystemProBasicOpen] = useState({});
  const [systemProBasicLoading, setSystemProBasicLoading] = useState({});
  const [systemProBasicCache, setSystemProBasicCache] = useState({});
  const [riskProData, setRiskProData] = useState([]);
  const [riskProTotal, setRiskProTotal] = useState(0);
  const [currentRiskProPage, setCurrentRiskProPage] = useState(0);
  const [riskProOpen, setRiskProOpen] = useState({});
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  useEffect(() => {
    const savedToken = localStorage.getItem('dpfs_token');
    if (savedToken) setIsLoggedIn(true);
  }, []);

  const [activeTab, setActiveTab] = useState('dashboard');

  const [formData, setFormData] = useState({
    modeName: '', productName: '', quantity: '',
    ingredients: [{ id: Date.now(), name: '', percentage: '' }],
    baseInfo: [{ id: Date.now() + 1, key: '', value: '' }]
  });

  const handleInputChange = (field, value) => setFormData({ ...formData, [field]: value });
  const addRow = (type) => {
    const newRow = { id: Date.now(), name: '', percentage: '', key: '', value: '' };
    setFormData({ ...formData, [type]: [...formData[type], newRow] });
  };
  const removeRow = (type, id) => setFormData({ ...formData, [type]: formData[type].filter(item => item.id !== id) });
  const updateDynamicRow = (type, id, field, value) => {
    const updated = formData[type].map(item => item.id === id ? { ...item, [field]: value } : item);
    setFormData({ ...formData, [type]: updated });
  };

  // // --- 核心修改：信息录入提交函数 ---
  // const handleSubmitData = async () => {
  //   const token = localStorage.getItem('dpfs_token');
  //   if (!token) return alert("请先登录");

  //   setIsLoading(true);
  //   const payload = {
  //     user_token: parseInt(token),
  //     schema: formData.modeName || "Standard",
  //     product_name: formData.productName,
  //     product_number: parseInt(formData.quantity) || 0,
  //     ingredients: formData.ingredients.map(i => [i.name, i.percentage]),
  //     base_info: formData.baseInfo.map(b => [b.key, b.value]),
  //     risk_report: genAiReport ? 1 : 0
  //   };

  //   try {
  //     const response = await fetch('/api/risk', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(payload)
  //     });
  //     const result = await response.json();

  //     if (result.code === 200) {
  //       const msg = genAiReport ? "产品信息录入成功，开始进行AI评估" : "产品信息录入成功";
  //       showToast(msg);
  //       if (genAiReport && result.risk_info) {
  //         setRiskReport(result.risk_info);
  //       }
  //     } else {
  //       showToast("产品信息录入失败");
  //     }
  //   } catch (error) {
  //     showToast("产品信息录入失败");
  //     console.error(error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleSubmitData = async () => {
    const token = localStorage.getItem('dpfs_token');
    if (!token) return alert("请先登录");

    setIsLoading(true);

    // 构造请求体
    const payload = {
      user_token: parseInt(token),
      schema: formData.modeName || "Standard",
      product_name: formData.productName,
      product_number: parseInt(formData.quantity) || 0,
      ingredients: formData.ingredients.map(i => [i.name, i.percentage]),
      base_info: formData.baseInfo.map(b => [b.key, b.value]),
      risk_report: genAiReport ? 1 : 0
    };

    try {
      const response = await fetch('/api/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // 检查 HTTP 状态
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      // 尝试解析文本而非直接 json()，防止后端返回非 JSON 导致崩溃
      const responseText = await response.text();
      console.log("服务器返回原始字符串:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error("后端返回的数据不是有效的 JSON 格式");
      }

      console.log("解析后的对象:", result);

      // 严格判断 code
      if (result && (result.code === 200 || Number(result.code) === 200)) {
        const msg = genAiReport ? "产品信息录入成功，开始进行AI评估" : "产品信息录入成功";
        showToast(msg);

        // 安全地更新报告内容
        if (genAiReport) {
          setRiskReport(formatRiskInfo(result?.risk_info));
        }
      } else {
        showToast(`录入失败: ${result?.message || '业务返回码错误'}`);
      }

    } catch (error) {
      // 这里会打印导致“网络连接异常”的真正元凶
      console.error("【关键报错信息】:", error.message);
      showToast(`录入失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const normalizeApiText = (value, emptyText) => {
    const fallback = emptyText || "无";
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value.trim() ? value : fallback;
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return String(value);
    }
  };

  const formatRiskInfo = (riskInfo) => {
    const levelMap = {
      l: '低风险',
      m: '中风险',
      h: '高风险'
    };
    const labelMap = {
      risk: '安全风险',
      health: '健康风险',
      comp_ana: '成分分析',
      pot_risk: '潜在风险',
      suggest: '建议'
    };
    const order = ['risk', 'health', 'comp_ana', 'pot_risk', 'suggest'];

    const indentBlock = (text, prefix) => {
      const p = prefix || '  ';
      const s = String(text ?? '').replace(/\r\n/g, '\n');
      if (!s.trim()) return '';
      return s
        .split('\n')
        .map((line) => (line.trim() ? `${p}${line}` : ''))
        .join('\n');
    };

    const tryParseJsonFromText = (text) => {
      const raw = String(text ?? '').trim();
      if (!raw) return null;
      const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      const candidate = (fenced && fenced[1] ? fenced[1] : raw).trim();
      if (!candidate) return null;
      if ((candidate.startsWith('{') && candidate.endsWith('}')) || (candidate.startsWith('[') && candidate.endsWith(']'))) {
        try {
          return JSON.parse(candidate);
        } catch (e) {
          return null;
        }
      }
      return null;
    };

    let obj = null;
    if (riskInfo && typeof riskInfo === 'object') obj = riskInfo;
    if (!obj && typeof riskInfo === 'string') obj = tryParseJsonFromText(riskInfo);
    if (!obj) return normalizeApiText(riskInfo, "服务器未返回具体评估内容。");

    const lines = [];
    const pushSection = (sectionLines) => {
      if (!Array.isArray(sectionLines) || sectionLines.length === 0) return;
      if (lines.length > 0) lines.push('');
      lines.push(...sectionLines);
    };
    const emitKeyValue = (k, v) => {
      const label = labelMap[k] || k;
      if (k === 'risk' || k === 'health') {
        const level = String(v ?? '').trim().toLowerCase();
        const text = levelMap[level] || String(v ?? '').trim();
        pushSection([`${label}: ${text || '无'}`]);
        return;
      }
      if (typeof v === 'string') {
        const content = v.trim();
        if (!content) {
          pushSection([`${label}: 无`]);
          return;
        }
        pushSection([`${label}:`, indentBlock(content)]);
        return;
      }
      if (v === null || v === undefined) {
        pushSection([`${label}: 无`]);
        return;
      }
      try {
        pushSection([`${label}:`, indentBlock(JSON.stringify(v, null, 2))]);
      } catch (e) {
        pushSection([`${label}: ${String(v)}`]);
      }
    };

    order.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(obj, k)) emitKeyValue(k, obj[k]);
    });
    Object.keys(obj).forEach((k) => {
      if (k === 'code' || k === 'message') return;
      if (order.includes(k)) return;
      emitKeyValue(k, obj[k]);
    });

    return lines.join('\n');
  };

  const parseTraceResult = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        return trimmed;
      }
    }
    return trimmed;
  };

  const renderTraceResult = (value) => {
    const parsed = parseTraceResult(value);
    if (parsed === null) return "未返回商品溯源结果";
    if (typeof parsed === 'string') return parsed;

    const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

    // 分区：基本信息、交易信息、配料信息
    const baseInfo = {};
    const tradeInfo = parsed.trade_info || [];
    const ingredientInfo = parsed.ingredient_info || [];
    Object.entries(parsed).forEach(([k, v]) => {
      if (k !== 'trade_info' && k !== 'ingredient_info') baseInfo[k] = v;
    });

    // 友好化 key 名
    const friendlyKey = (k) => {
      const map = {
        '类型': '产品类型', '生产日期': '生产日期', '包装': '包装方式',
        '品牌': '品牌', '净含量': '净含量', '保质期': '保质期',
        'Ingredient Name': '配料名', 'Ingredient Percentage': '占比',
        'IngredientInfo': '子配料'
      };
      return map[k] || k;
    };

    // 基本信息标签颜色
    const keyColor = (k) => {
      const lk = k.toLowerCase();
      if (lk.includes('品牌')) return 'text-violet-400';
      if (lk.includes('类型')) return 'text-cyan-400';
      if (lk.includes('日期') || lk.includes('保质')) return 'text-amber-400';
      if (lk.includes('净含量') || lk.includes('净重')) return 'text-rose-400';
      return 'text-emerald-400';
    };

    // 渲染配料树（递归）
    const renderIngredientTree = (items, depth = 0) => {
      if (!Array.isArray(items) || items.length === 0) return null;
      return (
        <div className={depth > 0 ? 'ml-3 border-l-2 border-emerald-500/15 pl-3' : ''}>
          {items.map((ing, idx) => {
            const name = ing['Ingredient Name'] || '未知';
            const pct = ing['Ingredient Percentage'] || '0';
            const children = ing['IngredientInfo'];
            const hasChildren = Array.isArray(children) && children.length > 0;
            const isObj2 = isObj(children) && Object.keys(children).length > 0;
            const key = `ing-${depth}-${idx}-${name}`;

            return (
              <div key={key} className="mb-1.5">
                <div className="flex items-center gap-2 py-1">
                  {depth > 0 && <span className="text-emerald-600/40 text-[10px]">●</span>}
                  <span className="font-semibold text-emerald-300 text-sm">{name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                    {pct}%
                  </span>
                  {(hasChildren || isObj2) && (
                    <span className="text-[10px] text-emerald-600/40">▸ 递归溯源</span>
                  )}
                </div>
                {(hasChildren || isObj2) && renderIngredientTree(
                  hasChildren ? children : [children], depth + 1
                )}
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div className="space-y-5">
        {/* 基本信息 */}
        {Object.keys(baseInfo).length > 0 && (
          <div>
            <div className="text-[10px] font-black tracking-[0.3em] uppercase text-emerald-500/60 mb-3 flex items-center gap-2">
              <ShieldCheck size={12} /> 基本信息
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {Object.entries(baseInfo).map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-2 py-1 border-b border-white/5">
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">{friendlyKey(k)}</span>
                  <span className={`text-sm font-semibold ${keyColor(k)} truncate`}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 交易信息 */}
        {tradeInfo.length > 0 && (
          <div>
            <div className="text-[10px] font-black tracking-[0.3em] uppercase text-emerald-500/60 mb-3 flex items-center gap-2">
              <Activity size={12} /> 交易信息
            </div>
            <div className="space-y-2">
              {tradeInfo.map((trade, idx) => (
                <div key={idx} className="bg-slate-800/40 rounded-xl p-3 border border-white/5">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(trade).map(([k, v]) => (
                      <div key={k} className="flex items-baseline gap-2">
                        <span className="text-[10px] text-slate-500 shrink-0">{k}</span>
                        <span className="text-xs text-emerald-400">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 配料溯源树 */}
        {ingredientInfo.length > 0 && (
          <div>
            <div className="text-[10px] font-black tracking-[0.3em] uppercase text-emerald-500/60 mb-3 flex items-center gap-2">
              <ListChecks size={12} /> 配料溯源
            </div>
            {renderIngredientTree(ingredientInfo)}
          </div>
        )}
      </div>
    );
  };

  const handleTrace = async () => {
    const token = localStorage.getItem('dpfs_token');
    if (!token) return alert("请先登录");
    if (!traceForm.traceCode.trim()) return showToast("请输入商品溯源代码");

    setIsLoading(true);
    const payload = {
      user_token: parseInt(token),
      trace_code: traceForm.traceCode.trim(),
      trace_detail: traceForm.traceDetail ? 1 : 0,
      ingre_detail: traceForm.ingreDetail ? 1 : 0,
      ai_risk: traceForm.aiRisk ? 1 : 0
    };

    try {
      const response = await fetch('/api/trace_back', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error("后端返回的数据不是有效的 JSON 格式");
      }

      if (result && (result.code === 200 || Number(result.code) === 200)) {
        setTraceResults({
          traceResult: result.trace_result,
          aiRiskReport: result.ai_risk_report ? formatRiskInfo(result.ai_risk_report) : "未返回AI风险评估",
          metaIngredients: result.meta_ingredient_table || []
        });
        showToast(result.message || "溯源成功");
      } else {
        showToast(result?.message || "溯源失败");
      }
    } catch (error) {
      showToast(`溯源失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMakeTrade = async () => {
    const token = localStorage.getItem('dpfs_token');
    if (!token) return alert("请先登录");

    setIsLoading(true);
    const toNumberOrZero = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const payload = {
      user_token: parseInt(token),
      trade_schema: tradeForm.trade_schema,
      trade_product_name: tradeForm.trade_product_name,
      trade_product_start_id: toNumberOrZero(tradeForm.trade_product_start_id),
      trade_product_number: toNumberOrZero(tradeForm.trade_product_number),
      buyer: tradeForm.buyer,
      buyer_addr: tradeForm.buyer_addr,
      buyer_phone: tradeForm.buyer_phone,
      seller: tradeForm.seller,
      seller_addr: tradeForm.seller_addr,
      seller_phone: tradeForm.seller_phone,
      logistics_info: tradeForm.logistics_info,
      other_info: tradeForm.other_info,
      trade_price: tradeForm.trade_price
    };

    try {
      const response = await fetch('/api/make_trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result && (result.code === 200 || Number(result.code) === 200)) {
        showToast("交易创建成功");
      } else {
        showToast(`交易创建失败：${result?.message || ''}`);
      }
    } catch (e) {
      showToast(`交易创建失败：${e?.message || ''}`);
    } finally {
      setIsLoading(false);
    }
  };

  const riskProKeyOf = (item) => `${item?.schema || ''}\u001f${item?.product_name || ''}`;

  const parseRiskDescription = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const formatRiskLevel = (value) => {
    const map = { l: '低风险', m: '中风险', h: '高风险' };
    const key = String(value ?? '').trim().toLowerCase();
    return map[key] || (String(value ?? '').trim() || '无');
  };

  const handleFetchRiskProData = async (beginIndex = 0) => {
    const token = localStorage.getItem('dpfs_token');
    if (!token) return alert("会话已过期，请重新登录");
    setIsLoading(true);
    try {
      const res = await fetch('/api/list_risk_pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_token: parseInt(token), begin: beginIndex, limit: 20 })
      });
      const result = await res.json();
      if (result && (result.code === 200 || Number(result.code) === 200)) {
        setRiskProTotal(Number(result.total) || 0);
        setRiskProData(result.pro_list || []);
        setCurrentRiskProPage(beginIndex);
        setRiskProOpen({});
      } else {
        alert(result?.message || "查询失败");
      }
    } catch (e) {
      alert(e?.message || "查询失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchSystemData = async (beginIndex = 0) => {
    const token = localStorage.getItem('dpfs_token');
    if (!token) return alert("会话已过期，请重新登录");
    setIsLoading(true);
    try {
      const checkRes = await fetch('/api/list_tracable_pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_token: parseInt(token), begin: 0, limit: 1 })
      });
      const checkResult = await checkRes.json();
      if (checkResult.code === 200) {
        setSystemTotal(checkResult.total);
        const fetchRes = await fetch('/api/list_tracable_pro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_token: parseInt(token), begin: beginIndex, limit: 20 })
        });
        const fetchResult = await fetchRes.json();
        if (fetchResult.code === 200) {
          setSystemData(fetchResult.trace_pros || []);
          setCurrentSystemPage(beginIndex);
          setSystemProBasicOpen({});
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 进入数据查询页时自动加载第一页
  useEffect(() => {
    if (isLoggedIn && activeTab === 'activity' && systemData.length === 0) {
      handleFetchSystemData(0);
    }
    if (isLoggedIn && activeTab === 'risk_query' && riskProData.length === 0) {
      handleFetchRiskProData(0);
    }
  }, [activeTab, isLoggedIn]);

  const systemProKeyOf = (item) => `${item?.group_name || ''}\u001f${item?.product_name || ''}\u001f${item?.trace_code_prefix || ''}`;

  const renderSystemProExtraInfo = (value) => {
    const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
    if (value === null || value === undefined) return <div className="text-slate-400 text-sm">暂无信息</div>;
    if (!isObj(value) && !Array.isArray(value)) return <div className="text-sm text-slate-700">{String(value)}</div>;

    // 递归渲染对象/数组为卡片化 key-value 列表
    const renderNode = (node, depth = 0) => {
      if (Array.isArray(node)) {
        // 判断是否是 [{key, value}] 结构
        const isKvArr = node.length > 0 && node.every(it => isObj(it) && 'key' in it && 'value' in it);
        if (isKvArr) {
          return (
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {node.map((kv, i) => (
                <div key={i} className="flex items-baseline gap-2 py-1.5 border-b border-slate-100/80">
                  <span className="text-xs font-bold text-slate-500 shrink-0">{String(kv.key)}</span>
                  <span className="text-xs text-slate-700 truncate">{String(kv.value)}</span>
                </div>
              ))}
            </div>
          );
        }
        return (
          <div className={depth > 0 ? 'ml-3 border-l-2 border-emerald-200 pl-3' : 'space-y-2'}>
            {node.map((item, i) => (
              <div key={i}>
                {isObj(item) ? renderNode(item, depth + 1) : <span className="text-xs text-slate-600">{String(item)}</span>}
              </div>
            ))}
          </div>
        );
      }

      if (isObj(node)) {
        const entries = Object.entries(node);
        if (entries.length === 0) return <div className="text-slate-400 text-xs">暂无信息</div>;
        return (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {entries.map(([k, v]) => {
              if (isObj(v) || Array.isArray(v)) {
                return (
                  <div key={k} className="col-span-2 py-2">
                    <div className="text-[10px] font-black tracking-wider uppercase text-emerald-600/70 mb-2">{k}</div>
                    {renderNode(v, depth + 1)}
                  </div>
                );
              }
              return (
                <div key={k} className="flex items-baseline gap-2 py-1.5 border-b border-slate-100/80">
                  <span className="text-xs font-bold text-slate-500 shrink-0">{k}</span>
                  <span className="text-xs text-slate-700 truncate">{String(v)}</span>
                </div>
              );
            })}
          </div>
        );
      }

      return <span className="text-xs text-slate-600">{String(node)}</span>;
    };

    return <div className="py-1">{renderNode(value)}</div>;
  };

  const handleToggleSystemProBasic = async (item) => {
    const key = systemProKeyOf(item);
    const isOpen = systemProBasicOpen[key] === true;
    if (isOpen) {
      setSystemProBasicOpen((prev) => ({ ...prev, [key]: false }));
      return;
    }

    setSystemProBasicOpen((prev) => ({ ...prev, [key]: true }));
    if (systemProBasicCache[key] || systemProBasicLoading[key]) return;

    const token = localStorage.getItem('dpfs_token');
    if (!token) return alert("会话已过期，请重新登录");

    setSystemProBasicLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const payload = {
        user_token: parseInt(token),
        schema: item?.group_name,
        name: item?.product_name
      };
      const response = await fetch('/api/list_pro_basic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result && (result.code === 200 || Number(result.code) === 200)) {
        const extra = {};
        Object.entries(result || {}).forEach(([k, v]) => {
          if (k === 'code' || k === 'message') return;
          extra[k] = v;
        });
        setSystemProBasicCache((prev) => ({ ...prev, [key]: extra }));
      } else {
        alert(result?.message || "请求失败");
        setSystemProBasicOpen((prev) => ({ ...prev, [key]: false }));
      }
    } catch (e) {
      alert(e?.message || "请求失败");
      setSystemProBasicOpen((prev) => ({ ...prev, [key]: false }));
    } finally {
      setSystemProBasicLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) return alert("请完整输入账号和访问密钥");
    setIsLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginForm.username, password: loginForm.password })
      });
      const result = await response.json();
      if (result.code === 0) {
        localStorage.setItem('dpfs_token', result.user_token);
        setIsLoggedIn(true);
      } else {
        alert(result.message || "身份验证失败");
      }
    } catch (error) {
      alert("连接失败");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-white relative overflow-hidden">
        <ParticleBackground />
        <header className="relative z-10 w-full p-8 md:p-12 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-950">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">基于DPFS的农产品安全风险智能评估系统</h1>
          </div>
          <div className="text-sm font-mono text-emerald-400 bg-emerald-950 px-4 py-1.5 rounded-full border border-emerald-800">
            System Status: NOMINAL
          </div>
        </header>
        <main className="relative z-10 flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
            <div className="lg:col-span-3 space-y-6 text-left animate-in fade-in slide-in-from-left-6 duration-1000">
              <div className="inline-block px-4 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full text-xs font-semibold tracking-widest uppercase">
                AI-Powered Security v2.0
              </div>
              <h2 className="text-5xl md:text-6xl font-black leading-tight tracking-tighter">
                为农产品供应链<br />注入<span className="text-emerald-500">智能与安全</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                利用深度学习算法，实时监测、评估并阻断农产品流转过程中的潜在风险。
              </p>
            </div>
            <div className="lg:col-span-2 space-y-10 animate-in fade-in slide-in-from-right-6 duration-1000 delay-300">
              <div>
                <h3 className="text-3xl font-extrabold tracking-tight mb-2">欢迎回来</h3>
                <p className="text-slate-500">请使用您的账号进行身份验证。</p>
              </div>
              <div className="space-y-6">
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                  <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} placeholder="输入管理账号" className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-900/50 border border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-lg" />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                  <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="输入访问密钥 (密码)" className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-900/50 border border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-lg text-white" />
                </div>
                <button onClick={handleLogin} className="group w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-500 transition-all transform hover:-translate-y-1 shadow-2xl shadow-emerald-950 flex items-center justify-center gap-3">
                  {isLoading ? "系统验证中..." : "验证身份进入系统"}
                  <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden text-slate-900 relative">
      {/* 提示文本框 */}
      {toast.show && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300 font-bold border border-white/10">
          {toast.message}
        </div>
      )}

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          localStorage.removeItem('dpfs_token');
          setIsLoggedIn(false);
          setShowLogoutModal(false);
        }}
      />

      <aside className="w-56 flex flex-col bg-white border-r border-slate-100 z-50 shrink-0">
        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-3 border-b border-slate-50">
          <div className="p-2.5 bg-slate-950 rounded-xl text-emerald-500 shadow-lg shadow-slate-200">
            <Zap size={22} fill="currentColor" />
          </div>
          <div>
            <div className="text-sm font-black text-slate-800 tracking-tight">DPFS</div>
            <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">食品溯源平台</div>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          <div className="px-3 mb-3 text-[9px] font-black tracking-[0.2em] uppercase text-slate-300">功能导航</div>
          {[
            { key: 'dashboard', icon: LayoutDashboard, label: '信息录入', desc: '产品风险评估' },
            { key: 'trace', icon: Search, label: '商品溯源', desc: '溯源链路查询' },
            { key: 'make_trade', icon: Plus, label: '创建交易', desc: '交易信息登记' },
            { key: 'activity', icon: Activity, label: '数据查询', desc: '系统溯源数据查询' },
            { key: 'risk_query', icon: ShieldCheck, label: '风险查询', desc: '安全风险评估' },
          ].map(({ key, icon: Icon, label, desc }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${
                  active
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${active ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-bold leading-tight ${active ? 'text-emerald-700' : 'text-slate-600 group-hover:text-slate-700'}`}>{label}</div>
                  <div className={`text-[10px] leading-tight ${active ? 'text-emerald-500/70' : 'text-slate-300'}`}>{desc}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* 底部退出 */}
        <div className="px-3 pb-5 border-t border-slate-50 pt-3">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all group"
          >
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-300 group-hover:bg-red-50 group-hover:text-red-400 transition-all">
              <LogOut size={16} />
            </div>
            <div className="text-xs font-bold text-slate-400 group-hover:text-red-500">退出登录</div>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex overflow-hidden">
        <div className={`h-full overflow-y-auto p-12 custom-scrollbar transition-all duration-500 ${(activeTab === 'activity' || activeTab === 'make_trade' || activeTab === 'risk_query') ? 'flex-1 bg-slate-50/50' : (activeTab === 'trace' ? 'flex-[0.85]' : 'flex-[1.3]')}`}>
          <div className={`${(activeTab === 'activity' || activeTab === 'make_trade' || activeTab === 'risk_query') ? 'max-w-6xl' : 'max-w-3xl'} mx-auto`}>

            {activeTab === 'dashboard' && (
              <>
                <header className="mb-12">
                  <span className="text-[10px] font-black tracking-[0.3em] text-emerald-600 uppercase mb-3 block">Security Collection</span>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">智能风险评估录入</h2>
                </header>
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-50">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                      <h3 className="font-bold text-lg">核心商品参数</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-8">
                      {[{ label: '扫描模式', key: 'modeName', ph: '标准模式' }, { label: '商品全称', key: 'productName', ph: '输入商品名' }, { label: '批次数量', key: 'quantity', ph: '0' }].map(item => (
                        <div key={item.key}>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-3 ml-1">{item.label}</label>
                          <input onChange={(e) => handleInputChange(item.key, e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-semibold text-slate-700" placeholder={item.ph} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-50">
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-3"><div className="w-2 h-8 bg-emerald-500 rounded-full"></div><h3 className="font-bold text-lg">成分配比清单</h3></div>
                      <button onClick={() => addRow('ingredients')} className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black hover:bg-emerald-600 hover:text-white transition-all">+ 新增行</button>
                    </div>
                    {formData.ingredients.map(row => (
                      <div key={row.id} className="flex gap-4 mb-3 animate-in fade-in slide-in-from-top-2">
                        <input onChange={(e) => updateDynamicRow('ingredients', row.id, 'name', e.target.value)} className="flex-[3] px-6 py-4 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-medium" placeholder="成分名" />
                        <input onChange={(e) => updateDynamicRow('ingredients', row.id, 'percentage', e.target.value)} className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-medium" placeholder="%" />
                        <button onClick={() => removeRow('ingredients', row.id)} className="p-3 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={22} /></button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-50 mb-6">
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-3"><div className="w-2 h-8 bg-emerald-500 rounded-full"></div><h3 className="font-bold text-lg">扩展数据项</h3></div>
                      <button onClick={() => addRow('baseInfo')} className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black hover:bg-emerald-600 hover:text-white transition-all">+ 新增参数</button>
                    </div>
                    {formData.baseInfo.map(row => (
                      <div key={row.id} className="flex gap-4 mb-4 group animate-in slide-in-from-top-2">
                        <input onChange={(e) => updateDynamicRow('baseInfo', row.id, 'key', e.target.value)} className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-medium" placeholder="数据标签" />
                        <input onChange={(e) => updateDynamicRow('baseInfo', row.id, 'value', e.target.value)} className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-medium" placeholder="内容" />
                        <button onClick={() => removeRow('baseInfo', row.id)} className="p-3 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={22} /></button>
                      </div>
                    ))}
                  </div>

                  {/* 新增：生成AI评估报告 & 信息录入按钮 */}
                  <div className="space-y-6 pb-10">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setGenAiReport(!genAiReport)}>
                      <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${genAiReport ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white group-hover:border-emerald-200'}`}>
                        {genAiReport && <Check size={18} strokeWidth={4} />}
                      </div>
                      <span className="font-bold text-slate-700">生成AI评估报告</span>
                    </div>
                    <button
                      onClick={handleSubmitData}
                      disabled={isLoading}
                      className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-emerald-600 transition-all transform hover:-translate-y-1 shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isLoading ? <RefreshCw className="animate-spin" size={24} /> : <Box size={24} />}
                      信息录入
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'trace' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                <header className="mb-12">
                  <span className="text-[10px] font-black tracking-[0.3em] text-emerald-600 uppercase mb-3 block">Product Traceability</span>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">商品溯源</h2>
                </header>

                <div className="space-y-8">
                  <div className="bg-white p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-50">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                      <h3 className="font-bold text-lg">溯源参数</h3>
                    </div>

                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-3 ml-1">商品溯源代码</label>
                    <input
                      value={traceForm.traceCode}
                      onChange={(e) => setTraceForm({ ...traceForm, traceCode: e.target.value })}
                      className="w-full px-6 py-5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-mono font-bold text-slate-700 mb-8"
                      placeholder="输入商品溯源代码"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                      {[
                        { key: 'traceDetail', title: '返回详细交易信息' },
                        { key: 'ingreDetail', title: '返回详细配料信息' },
                        { key: 'aiRisk', title: '返回AI风险评估信息' }
                      ].map((opt) => (
                        <div
                          key={opt.key}
                          onClick={() => setTraceForm({ ...traceForm, [opt.key]: !traceForm[opt.key] })}
                          className={`p-5 rounded-2xl border-2 cursor-pointer text-center text-xs font-black transition-all ${traceForm[opt.key] ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 text-slate-400 hover:border-emerald-200'}`}
                        >
                          {opt.title}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleTrace}
                      disabled={isLoading}
                      className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-emerald-600 transition-all transform hover:-translate-y-1 shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isLoading ? <RefreshCw className="animate-spin" size={24} /> : <Search size={24} />}
                      进行溯源
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'make_trade' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                <header className="mb-12">
                  <span className="text-[10px] font-black tracking-[0.3em] text-emerald-600 uppercase mb-3 block">Trade Creation</span>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">创建交易</h2>
                </header>

                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-50">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                      <h3 className="font-bold text-lg">交易信息</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                        { label: '发生交易的溯源组', key: 'trade_schema', ph: '输入溯源组' },
                        { label: '发生交易的产品名称', key: 'trade_product_name', ph: '输入产品名称' },
                        { label: '发生交易的产品起始ID', key: 'trade_product_start_id', ph: '输入起始ID' },
                        { label: '发生交易的产品数量', key: 'trade_product_number', ph: '输入数量' },
                        { label: '发生金额', key: 'trade_price', ph: '输入金额' },
                        { label: '物流信息', key: 'logistics_info', ph: '输入物流信息' },
                        { label: '其它信息', key: 'other_info', ph: '输入其它信息' }
                      ].map((f) => (
                        <div key={f.key}>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-3 ml-1">{f.label}</label>
                          <input
                            type={(f.key === 'trade_product_start_id' || f.key === 'trade_product_number') ? 'number' : 'text'}
                            value={tradeForm[f.key]}
                            onChange={(e) => setTradeForm({ ...tradeForm, [f.key]: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-semibold text-slate-700"
                            placeholder={f.ph}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-50">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                      <h3 className="font-bold text-lg">买卖双方</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                        { label: '买方名称', key: 'buyer', ph: '输入买方名称' },
                        { label: '买方地址', key: 'buyer_addr', ph: '输入买方地址' },
                        { label: '买方联系方式', key: 'buyer_phone', ph: '输入买方联系方式' },
                        { label: '卖方名称', key: 'seller', ph: '输入卖方名称' },
                        { label: '卖方地址', key: 'seller_addr', ph: '输入卖方地址' },
                        { label: '卖方联系方式', key: 'seller_phone', ph: '输入卖方联系方式' }
                      ].map((f) => (
                        <div key={f.key}>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-3 ml-1">{f.label}</label>
                          <input
                            value={tradeForm[f.key]}
                            onChange={(e) => setTradeForm({ ...tradeForm, [f.key]: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-semibold text-slate-700"
                            placeholder={f.ph}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleMakeTrade}
                    disabled={isLoading}
                    className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-emerald-600 transition-all transform hover:-translate-y-1 shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isLoading ? <RefreshCw className="animate-spin" size={24} /> : <Plus size={24} />}
                    提交创建交易
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'risk_query' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                <header className="mb-12 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black tracking-[0.3em] text-emerald-600 uppercase mb-3 block">High Risk Products</span>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">查询高风险商品信息</h2>
                  </div>
                  <button onClick={() => handleFetchRiskProData(0)} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-500 shadow-xl shadow-emerald-950/10 transition-all">
                    <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} /> 查询高风险商品
                  </button>
                </header>

                <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-50 overflow-hidden mb-8">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">所在组</th>
                        <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">产品名称</th>
                        <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">安全风险</th>
                        <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">健康风险</th>
                        <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {riskProData.map((item, idx) => {
                        const key = riskProKeyOf(item);
                        const parsed = parseRiskDescription(item?.risk_description);
                        const isOpen = riskProOpen[key] === true;
                        return (
                          <React.Fragment key={idx}>
                            <tr className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-8 py-6 font-medium text-slate-600">{item.schema}</td>
                              <td className="px-8 py-6 font-bold text-slate-800">{item.product_name}</td>
                              <td className="px-8 py-6 font-black text-slate-700">{formatRiskLevel(parsed?.risk)}</td>
                              <td className="px-8 py-6 font-black text-slate-700">{formatRiskLevel(parsed?.health)}</td>
                              <td className="px-8 py-6 text-right">
                                <button
                                  type="button"
                                  onClick={() => setRiskProOpen((prev) => ({ ...prev, [key]: !prev[key] }))}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 text-slate-600 font-black text-xs hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all"
                                >
                                  风险详情
                                  <ChevronRight size={16} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                                </button>
                              </td>
                            </tr>
                            {isOpen && (
                              <tr className="bg-slate-50/40">
                                <td colSpan={5} className="px-8 py-6">
                                  <div className="bg-white rounded-3xl border border-slate-100 p-8">
                                    <div className="text-xs font-mono font-black tracking-[0.35em] uppercase text-emerald-600/80 mb-4">RISK DESCRIPTION</div>
                                    <div className="font-mono text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                      {formatRiskInfo(item?.risk_description)}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                  {riskProData.length === 0 && !isLoading && <div className="py-20 text-center text-slate-300 italic font-medium">点击上方按钮查询高风险商品</div>}
                </div>

                {riskProTotal > 0 && (
                  <div className="flex justify-center items-center gap-6">
                    <button disabled={currentRiskProPage === 0 || isLoading} onClick={() => handleFetchRiskProData(currentRiskProPage - 20)} className="p-4 bg-white rounded-xl border border-slate-100 disabled:opacity-30 hover:text-emerald-500 transition-all"><ChevronLeft size={20} /></button>
                    <div className="text-sm font-bold text-slate-500">第 {Math.floor(currentRiskProPage / 20) + 1} / {Math.ceil(riskProTotal / 20)} 页 <span className="ml-3 text-slate-300 font-normal">(总计 {riskProTotal} 条)</span></div>
                    <button disabled={currentRiskProPage + 20 >= riskProTotal || isLoading} onClick={() => handleFetchRiskProData(currentRiskProPage + 20)} className="p-4 bg-white rounded-xl border border-slate-100 disabled:opacity-30 hover:text-emerald-500 transition-all"><ChevronRight size={20} /></button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                <header className="mb-8 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                      <Activity size={20} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">系统溯源数据查询</h2>
                      <p className="text-xs text-slate-400 mt-0.5">查询系统中已录入的产品溯源数据</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFetchSystemData(0)}
                    disabled={isLoading}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    查询系统数据
                  </button>
                </header>

                {systemData.length === 0 && !isLoading ? (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                      <Search size={32} />
                    </div>
                    <div className="text-slate-400 font-semibold mb-1">暂无数据</div>
                    <div className="text-slate-300 text-sm">点击上方按钮同步系统数据</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {systemData.map((item, idx) => {
                      const key = systemProKeyOf(item);
                      const isOpen = systemProBasicOpen[key];
                      return (
                        <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                          <div
                            className="flex items-center gap-4 px-6 py-4 cursor-pointer select-none"
                            onClick={() => handleToggleSystemProBasic(item)}
                          >
                            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                              <Box size={16} />
                            </div>
                            <div className="flex-1 min-w-0 flex items-center gap-6">
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 text-sm truncate">{item.product_name}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md">{item.group_name}</span>
                                </div>
                              </div>
                              <div className="font-mono text-[11px] text-emerald-600/80 bg-emerald-50/60 px-3 py-1 rounded-lg truncate max-w-[240px]" title={item.trace_code_prefix}>
                                {item.trace_code_prefix}
                              </div>
                            </div>
                            <ChevronRight size={18} className={`text-slate-300 transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
                          </div>

                          {isOpen && (
                            <div className="border-t border-slate-50 bg-slate-50/30 px-6 py-5 animate-in fade-in slide-in-from-top-2 duration-300">
                              {systemProBasicLoading[key] ? (
                                <div className="flex items-center gap-2 text-slate-400 text-sm py-4 justify-center">
                                  <RefreshCw size={14} className="animate-spin" />
                                  加载中...
                                </div>
                              ) : (
                                <div className="bg-white rounded-xl border border-slate-100 p-5">
                                  <div className="text-[10px] font-black tracking-[0.2em] uppercase text-emerald-600/60 mb-3 flex items-center gap-1.5">
                                    <ShieldCheck size={10} /> 基本信息
                                  </div>
                                  {renderSystemProExtraInfo(systemProBasicCache[key])}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {systemTotal > 0 && (
                  <div className="flex justify-center items-center gap-3 mt-6">
                    <button
                      disabled={currentSystemPage === 0 || isLoading}
                      onClick={() => handleFetchSystemData(currentSystemPage - 20)}
                      className="px-4 py-2 bg-white rounded-lg border border-slate-100 text-slate-500 text-xs font-bold disabled:opacity-30 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center gap-1"
                    >
                      <ChevronLeft size={14} /> 上一页
                    </button>
                    <div className="text-xs text-slate-400 font-medium px-4 py-2 bg-white rounded-lg border border-slate-50">
                      第 <span className="text-slate-700 font-bold">{Math.floor(currentSystemPage / 20) + 1}</span> / {Math.ceil(systemTotal / 20)} 页
                      <span className="ml-2 text-slate-300">共 {systemTotal} 条</span>
                    </div>
                    <button
                      disabled={currentSystemPage + 20 >= systemTotal || isLoading}
                      onClick={() => handleFetchSystemData(currentSystemPage + 20)}
                      className="px-4 py-2 bg-white rounded-lg border border-slate-100 text-slate-500 text-xs font-bold disabled:opacity-30 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center gap-1"
                    >
                      下一页 <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧评估面板逻辑修改 */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 h-full bg-slate-900 p-12 flex flex-col relative text-white animate-in slide-in-from-right-full duration-500">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 0.8px, transparent 0.8px)', backgroundSize: '32px 32px' }}></div>

            <div className="relative z-10 h-full flex flex-col">
              <header className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3 text-emerald-500">
                  <Activity size={22} className="animate-pulse" />
                  <span className="text-xs font-mono font-black tracking-[0.4em] uppercase">Security Engine</span>
                </div>
              </header>

              {/* 核心修改点：父容器增加 overflow-hidden，子容器使用 flex-1 和 min-h-0 */}
              <div className="flex-1 bg-slate-950/40 rounded-[3.5rem] border border-white/5 backdrop-blur-3xl p-10 flex flex-col overflow-hidden">
                {isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="relative mb-10">
                      <div className="w-32 h-32 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                      <Cpu size={48} className="absolute inset-0 m-auto text-emerald-500 animate-pulse" />
                    </div>
                    <h4 className="text-emerald-400 font-mono tracking-[0.5em] animate-pulse">DPFS ENCRYPTED SCANNING</h4>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-6 duration-1000">
                    <div className="flex items-center gap-3 mb-10 shrink-0"> {/* shrink-0 防止标题被压缩 */}
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                        <CheckCircle size={24} />
                      </div>
                      <h3 className="text-2xl font-black text-white">评估报告</h3>
                    </div>

                    {/* 文本展示区：增加 overflow-y-auto 和 flex-1 */}
                    <div className="flex-1 bg-slate-900/80 rounded-[2.5rem] p-8 font-mono text-sm text-emerald-400/90 border border-white/5 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner custom-scrollbar">
                      {riskReport}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trace' && (
          <div className="flex-[1.35] h-full bg-slate-900 p-10 flex flex-col relative text-white animate-in slide-in-from-right-full duration-500">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 0.8px, transparent 0.8px)', backgroundSize: '32px 32px' }}></div>

            <div className="relative z-10 h-full flex flex-col">
              <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3 text-emerald-500">
                  <Activity size={22} className="animate-pulse" />
                  <span className="text-xs font-mono font-black tracking-[0.4em] uppercase">Trace Engine</span>
                </div>
              </header>

              <div className="flex-1 bg-slate-950/40 rounded-[3rem] border border-white/5 backdrop-blur-3xl p-8 flex flex-col overflow-hidden">
                {isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="relative mb-10">
                      <div className="w-32 h-32 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                      <Cpu size={48} className="absolute inset-0 m-auto text-emerald-500 animate-pulse" />
                    </div>
                    <h4 className="text-emerald-400 font-mono tracking-[0.5em] animate-pulse">DPFS TRACE SCANNING</h4>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-6 duration-1000">
                    <div className="flex items-center gap-3 mb-6 shrink-0">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                        <ListChecks size={20} />
                      </div>
                      <h3 className="text-xl font-black text-white">溯源结果</h3>
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col gap-5">
                      {/* 溯源详情 */}
                      <div className="flex-1 min-h-0 bg-slate-900/80 rounded-[2rem] p-6 border border-white/5 overflow-y-auto shadow-inner custom-scrollbar">
                        {renderTraceResult(traceResults.traceResult)}
                      </div>

                      {/* 元配料整合表 */}
                      {traceResults.metaIngredients && traceResults.metaIngredients.length > 0 && (
                        <div className="shrink-0 bg-slate-900/80 rounded-[2rem] p-6 border border-white/5 shadow-inner">
                          <div className="text-[10px] font-black tracking-[0.3em] uppercase text-amber-400/80 mb-4 flex items-center gap-2">
                            <ShieldCheck size={12} /> 元配料整合表
                          </div>
                          <div className="space-y-2">
                            {traceResults.metaIngredients.map((item, idx) => {
                              const pctNum = parseFloat(item.percentage) || 0;
                              return (
                                <div key={idx} className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-slate-200 w-20 shrink-0 truncate" title={item.name}>{item.name}</span>
                                  <div className="flex-1 h-5 bg-slate-800/60 rounded-full overflow-hidden relative">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-amber-500/80 to-amber-400/60 transition-all duration-700"
                                      style={{ width: `${Math.min(pctNum, 100)}%` }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/90 font-mono">
                                      {item.percentage}
                                    </span>
                                  </div>
                                  <span className="text-xs font-mono font-bold text-amber-400 w-16 text-right shrink-0">{item.grams}g</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* AI 风险评估 */}
                      {traceForm.aiRisk && (
                        <div className="flex-1 min-h-0 bg-slate-900/80 rounded-[2rem] p-6 border border-white/5 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner custom-scrollbar">
                          <div className="text-[10px] font-black tracking-[0.35em] uppercase text-blue-400/80 mb-4">AI 风险评估</div>
                          <div className="font-mono text-sm text-blue-400/90">{traceResults.aiRiskReport}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
