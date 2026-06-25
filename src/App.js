import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, LogOut, ShieldCheck, Activity, Cpu,
  CheckCircle, Box, ListChecks, ArrowRight,
  User, Lock, LayoutDashboard, Zap, Search, ChevronRight,
  RefreshCw, ChevronLeft, Check, Pencil, Save, Hash, Upload,
  Play, Film, File, Download, X, Eye, UserPlus, ChevronDown,
  Monitor, HardDrive, MemoryStick, Clock, AlertTriangle
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

// --- 折线图组件：每分钟溯源查询实时趋势 ---
const TraceLineChart = ({ data }) => {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const pad = { top: 20, right: 20, bottom: 35, left: 45 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    // 清空
    ctx.clearRect(0, 0, W, H);

    // 计算数据范围
    const values = data.map(d => d.count);
    let maxVal = Math.max(...values, 1);
    maxVal = Math.ceil(maxVal * 1.2); // 上方留 20% 余量
    if (maxVal < 5) maxVal = 5;

    // 背景网格
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
    }

    // Y 轴标签
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      const val = Math.round(maxVal - (maxVal / 4) * i);
      ctx.fillText(val.toString(), pad.left - 8, y + 4);
    }

    if (data.length < 2) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('等待数据积累中...', W / 2, H / 2);
      return;
    }

    // 计算点坐标
    const stepX = chartW / (data.length - 1);
    const points = data.map((d, i) => ({
      x: pad.left + i * stepX,
      y: pad.top + chartH - (d.count / maxVal) * chartH
    }));

    // 渐变填充
    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, pad.top + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // 折线
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 数据点圆点 (只画最近的几个)
    const dotCount = Math.min(points.length, 10);
    for (let i = points.length - dotCount; i < points.length; i++) {
      const p = points[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // X 轴标签 (每隔几个显示)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    const labelInterval = Math.max(1, Math.floor(data.length / 6));
    for (let i = 0; i < data.length; i += labelInterval) {
      const shortTime = data[i].time.split(':').slice(1).join(':'); // MM:SS
      ctx.fillText(shortTime, points[i].x, pad.top + chartH + 18);
    }
    // 始终显示最后一个
    const lastTime = data[data.length - 1].time.split(':').slice(1).join(':');
    ctx.fillText(lastTime, points[points.length - 1].x, pad.top + chartH + 18);

    // 当前值标注
    const lastVal = data[data.length - 1].count;
    const lastPoint = points[points.length - 1];
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(lastVal.toString(), lastPoint.x + 8, lastPoint.y - 4);

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 200, display: 'block' }}
    />
  );
};

export default function App() {
  // ─── 页面权限映射 ───
  // 每个导航页面对应的后端权限码，null 表示所有已登录用户可见
  const PAGE_PERMISSIONS = {
    dashboard:   'product:risk:create',
    trace:       'product:trace',
    make_trade:  'trade:create',
    activity:    'product:list',
    risk_query:  'product:risk:view',
    monitor:     null,
    profile:     null,
  };
  // 角色权限表（与后端 role_permissions 表一致）
  const ROLE_PERMISSIONS = {
    admin:        ['*'],
    supervisor:   ['product:list', 'product:drop', 'product:trace', 'product:risk:view', 'system:audit:view'],
    manufacturer: ['product:list', 'product:trace', 'product:risk:create', 'trade:create'],
    consumer:     ['product:trace'],
  };
  // 检查当前用户是否有权限访问某页面
  const hasPagePermission = (pageKey) => {
    const required = PAGE_PERMISSIONS[pageKey];
    if (!required) return true;
    const role = localStorage.getItem('dpfs_role') || '';
    const perms = ROLE_PERMISSIONS[role] || [];
    return perms.includes('*') || perms.includes(required);
  };

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
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '', role: 'consumer' });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [profileView, setProfileView] = useState('info');
  const [editForm, setEditForm] = useState({ real_name: '', phone: '', mail: '', description: '' });
  const [editLoading, setEditLoading] = useState(false);

  // --- 监控状态 ---
  const [monitorData, setMonitorData] = useState(null);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorAutoRefresh, setMonitorAutoRefresh] = useState(true);
  const [traceHistory, setTraceHistory] = useState([]); // [{time, count}]
  const traceHistoryRef = useRef([]); // ref for timer closure
  const [tradeHistory, setTradeHistory] = useState([]); // [{time, count}]
  const tradeHistoryRef = useRef([]);

  // --- 删除产品确认弹窗 ---
  const [dropModal, setDropModal] = useState({ open: false, item: null });
  const [dropLoading, setDropLoading] = useState(false);

  // --- 文件列表弹窗 ---
  const [fileModal, setFileModal] = useState({ open: false, item: null, files: [], loading: false });
  const [viewingFile, setViewingFile] = useState(null); // { name, path }

  useEffect(() => {
    const savedToken = localStorage.getItem('dpfs_token');
    if (savedToken) setIsLoggedIn(true);
  }, []);

  const [activeTab, setActiveTab] = useState('dashboard');

  // 获取用户首页（导航栏第一个有权限的页面）
  const getUserHomePage = () => {
    return ['dashboard','trace','make_trade','activity','risk_query','monitor','profile']
      .find(key => hasPagePermission(key)) || 'profile';
  };

  // 当前 activeTab 无权限时自动跳转到首页
  useEffect(() => {
    if (isLoggedIn && !hasPagePermission(activeTab)) {
      setActiveTab(getUserHomePage());
    }
  }, [isLoggedIn, activeTab]);

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

  // 文件上传状态
  const fileInputRef = useRef(null);
  const [uploadingRowId, setUploadingRowId] = useState(null);

  const handleFileUpload = async (rowId) => {
    // 触发隐藏的文件选择器，记住目标 rowId
    if (fileInputRef.current) {
      fileInputRef.current._targetRowId = rowId;
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem('dpfs_token');
    if (!token) { showToast('请先登录'); return; }

    if (!formData.modeName || !formData.productName) {
      showToast('请先填写模式和产品名称');
      return;
    }

    const rowId = fileInputRef.current._targetRowId;
    setUploadingRowId(rowId);

    try {
      // 读取文件为 base64
      const base64Content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // reader.result 格式: "data:...;base64,XXXX"
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const uploadPayload = {
        user_token: parseInt(token),
        schema: formData.modeName,
        product_name: formData.productName,
        file_name: file.name,
        file_content: base64Content
      };

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadPayload)
      });
      const result = await response.json();

      if (result.code === 200) {
        // 将文件路径回填到对应行的 value 字段
        updateDynamicRow('baseInfo', rowId, 'value', result.file_path);
        showToast('文件上传成功');
      } else {
        showToast('上传失败: ' + (result.message || '未知错误'));
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast('上传失败: ' + err.message);
    } finally {
      setUploadingRowId(null);
      // 清空 file input 以允许重复选择同一文件
      e.target.value = '';
    }
  };

  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  // --- 监控数据获取 ---
  const fetchMonitorData = async () => {
    const token = localStorage.getItem('dpfs_token');
    if (!token) return;
    setMonitorLoading(true);
    try {
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_token: parseInt(token) })
      });
      const result = await response.json();
      if (result.code === 200) {
        setMonitorData(result);
        // 记录溯源查询历史 (保留最近60个数据点，约5分钟)
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('zh-CN', { hour12: false });
        const newEntry = { time: timeLabel, count: result.trace_count_per_min || 0 };
        traceHistoryRef.current = [...traceHistoryRef.current.slice(-59), newEntry];
        setTraceHistory([...traceHistoryRef.current]);
        // 记录交易统计历史
        const tradeEntry = { time: timeLabel, count: result.trade_count_per_min || 0 };
        tradeHistoryRef.current = [...tradeHistoryRef.current.slice(-59), tradeEntry];
        setTradeHistory([...tradeHistoryRef.current]);
      }
    } catch (err) {
      console.error('Monitor fetch error:', err);
    } finally {
      setMonitorLoading(false);
    }
  };

  // 监控页面自动刷新 (每5秒)
  useEffect(() => {
    if (!isLoggedIn || activeTab !== 'monitor') return;
    fetchMonitorData();
    if (!monitorAutoRefresh) return;
    const interval = setInterval(fetchMonitorData, 5000);
    return () => clearInterval(interval);
  }, [isLoggedIn, activeTab, monitorAutoRefresh]);

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
        <div className={depth > 0 ? 'ml-2.5 border-l border-emerald-500/10 pl-3' : ''}>
          {items.map((ing, idx) => {
            const name = ing['Ingredient Name'] || '未知';
            const pct = ing['Ingredient Percentage'] || '0';
            const rawChildren = ing['IngredientInfo'];
            // IngredientInfo 可能是数组（子配料列表）或对象（含产品基本信息 + 嵌套 IngredientInfo 数组）
            // 当为对象时，提取其中的 IngredientInfo 数组作为子配料，跳过基本信息字段
            let children;
            if (Array.isArray(rawChildren)) {
              children = rawChildren;
            } else if (isObj(rawChildren) && Object.keys(rawChildren).length > 0) {
              children = rawChildren['IngredientInfo'] || [];
              // 如果对象中没有嵌套 IngredientInfo，则 children 为空数组（叶节点含产品信息）
              if (!Array.isArray(children)) children = [children];
            } else {
              children = [];
            }
            const hasChildren = children.length > 0;
            const key = `ing-${depth}-${idx}-${name}`;

            return (
              <div key={key} className="mb-1">
                <div className="flex items-center gap-2 py-0.5 group cursor-default">
                  {depth > 0 && <span className="text-emerald-600/30 text-[8px]">●</span>}
                  <span className="text-[12px] font-semibold text-emerald-300/90 group-hover:text-emerald-200 transition-colors">{name}</span>
                  <span className="text-[10px] px-1.5 py-px rounded-md bg-emerald-500/8 text-emerald-400/70 font-mono font-semibold">
                    {pct}%
                  </span>
                  {hasChildren && (
                    <span className="text-[9px] text-emerald-600/30 opacity-0 group-hover:opacity-100 transition-opacity">▸ 递归溯源</span>
                  )}
                </div>
                {hasChildren && renderIngredientTree(children, depth + 1)}
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        {/* 基本信息 */}
        {Object.keys(baseInfo).length > 0 && (
          <div>
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-500/50 mb-2.5 flex items-center gap-1.5">
              <ShieldCheck size={10} /> 基本信息
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
              {Object.entries(baseInfo).map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-2 py-1.5 border-b border-white/[0.04]">
                  <span className="text-[10px] font-semibold text-slate-500 shrink-0">{friendlyKey(k)}</span>
                  <span className={`text-xs font-semibold ${keyColor(k)} truncate`}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 交易信息 */}
        {tradeInfo.length > 0 && (
          <div>
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-500/50 mb-2.5 flex items-center gap-1.5">
              <Activity size={10} /> 交易信息
            </div>
            <div className="space-y-2">
              {tradeInfo.map((trade, idx) => (
                <div key={idx} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.04]">
                  <div className="text-[9px] text-emerald-500/40 font-mono mb-1.5">交易 #{idx + 1}</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(trade).map(([k, v]) => (
                      <div key={k} className="flex items-baseline gap-1.5">
                        <span className="text-[9px] text-slate-500 shrink-0">{k}</span>
                        <span className="text-[11px] text-emerald-400/80">{String(v)}</span>
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
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-500/50 mb-2.5 flex items-center gap-1.5">
              <ListChecks size={10} /> 配料溯源
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
    if (!traceForm.traceCode.trim()) return showToast("请输入溯源码");

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
          traceResult: result.trace_result_json || result.trace_result,
          aiRiskReport: result.ai_risk_report ? formatRiskInfo(result.ai_risk_report) : "未返回AI个性化评估",
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
      } else if (result && (result.code === 0 || Number(result.code) === 0)) {
        // 栏目为空 / 无更多数据，静默处理，不弹框
        setRiskProTotal(0);
        setRiskProData([]);
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
      } else if (checkResult.code === 0 || checkResult.code === -34 || Number(checkResult.code) === 0 || Number(checkResult.code) === -34) {
        // 空结果：dpfs返回0(ENOENT)或-34(超出范围)均视为无数据，清空列表
        setSystemTotal(0);
        setSystemData([]);
        setCurrentSystemPage(0);
        setSystemProBasicOpen({});
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 删除溯源产品 ---
  const handleDropTracablePro = async () => {
    if (!dropModal.item) return;
    const token = localStorage.getItem('dpfs_token');
    if (!token) { showToast("会话已过期，请重新登录"); return; }
    setDropLoading(true);
    try {
      const res = await fetch('/api/drop_tracable_pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_token: parseInt(token),
          schema: dropModal.item.group_name,
          product_name: dropModal.item.product_name
        })
      });
      const result = await res.json();
      if (result.code === 200) {
        showToast('删除成功');
        setDropModal({ open: false, item: null });
        // 刷新当前页
        handleFetchSystemData(currentSystemPage);
      } else {
        showToast(`删除失败: ${result.message || '未知错误'}`);
      }
    } catch (e) {
      showToast(`删除失败: ${e?.message || '网络错误'}`);
    } finally {
      setDropLoading(false);
    }
  };

  // 检查当前用户是否有 product:drop 权限
  const hasDropPermission = () => {
    const role = localStorage.getItem('dpfs_role') || '';
    const perms = ROLE_PERMISSIONS[role] || [];
    return perms.includes('*') || perms.includes('product:drop');
  };

  // 获取产品已上传的文件列表
  const handleFetchFiles = async (item) => {
    const token = localStorage.getItem('dpfs_token');
    if (!token) { showToast('请先登录'); return; }

    setFileModal({ open: true, item, files: [], loading: true });
    setViewingFile(null);

    try {
      const response = await fetch('/api/list_files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_token: parseInt(token),
          schema: item.group_name,
          product_name: item.product_name
        })
      });
      const result = await response.json();
      if (result.code === 200) {
        setFileModal(prev => ({ ...prev, files: result.files || [], loading: false }));
      } else {
        setFileModal(prev => ({ ...prev, files: [], loading: false }));
        showToast(result.message || '获取文件列表失败');
      }
    } catch (err) {
      setFileModal(prev => ({ ...prev, files: [], loading: false }));
      showToast('获取文件列表失败');
    }
  };

  // 判断文件是否为视频
  const isVideoFile = (filename) => {
    const ext = (filename || '').toLowerCase().split('.').pop();
    return ['mp4', 'webm', 'avi', 'mov', 'mkv', 'ogg'].includes(ext);
  };

  // 判断文件是否为图片
  const isImageFile = (filename) => {
    const ext = (filename || '').toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext);
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
                  <span className="text-xs text-slate-700 select-all break-all">{String(kv.value)}</span>
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
                <div key={k} className="flex items-baseline gap-2 py-1.5 border-b border-slate-100/80 group">
                  <span className="text-xs font-bold text-slate-500 shrink-0">{k}</span>
                  <span className="text-xs text-slate-700 select-all break-all">{String(v)}</span>
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
        // 产品可能已被删除（Table does not exist），从列表中移除并刷新
        setSystemProBasicOpen((prev) => ({ ...prev, [key]: false }));
        if (result?.code === -2 || (result?.message && result.message.includes('does not exist'))) {
          showToast('该产品数据已不存在，列表已刷新');
          handleFetchSystemData(currentSystemPage);
        } else {
          showToast(result?.message || "请求失败");
        }
      }
    } catch (e) {
      setSystemProBasicOpen((prev) => ({ ...prev, [key]: false }));
      showToast(e?.message || "请求失败");
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
        localStorage.setItem('dpfs_role', result.role);
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

  const handleRegister = async () => {
    if (!registerForm.username || !registerForm.password) return alert("请完整输入用户名和密码");
    if (registerForm.password.length < 6) return alert("密码长度不能少于6位");
    if (registerForm.password !== registerForm.confirmPassword) return alert("两次输入的密码不一致");
    setRegisterLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerForm.username,
          password: registerForm.password,
          role: registerForm.role
        })
      });
      const result = await response.json();
      if (result.code === 200) {
        alert("注册成功！请使用新账号登录。");
        setShowRegister(false);
        setLoginForm({ username: registerForm.username, password: '' });
        setRegisterForm({ username: '', password: '', confirmPassword: '', role: 'consumer' });
      } else {
        alert(result.message || "注册失败");
      }
    } catch (error) {
      alert("连接失败");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleFetchUserInfo = async () => {
    const token = localStorage.getItem('dpfs_token');
    if (!token) return;
    try {
      const res = await fetch('/api/user_info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_token: parseInt(token) })
      });
      const data = await res.json();
      if (data.code === 200) {
        setUserInfo(data);
      }
    } catch (e) {
      console.error('Fetch user info failed:', e);
    }
  };

  const handleUpdatePassword = async () => {
    if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      return showToast('请填写所有密码字段');
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      return showToast('两次输入的新密码不一致');
    }
    if (pwdForm.newPassword.length < 4) {
      return showToast('新密码至少4个字符');
    }
    const token = localStorage.getItem('dpfs_token');
    if (!token) return;
    setPwdLoading(true);
    try {
      const res = await fetch('/api/update_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_token: parseInt(token),
          old_password: pwdForm.oldPassword,
          new_password: pwdForm.newPassword
        })
      });
      const data = await res.json();
      if (data.code === 200) {
        showToast('密码修改成功');
        setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(data.message || '密码修改失败');
      }
    } catch (e) {
      showToast('密码修改失败: ' + e.message);
    } finally {
      setPwdLoading(false);
    }
  };

  const handleUpdateUserInfo = async () => {
    const token = localStorage.getItem('dpfs_token');
    if (!token) return;
    setEditLoading(true);
    try {
      const res = await fetch('/api/update_user_info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_token: parseInt(token), ...editForm })
      });
      const data = await res.json();
      if (data.code === 200) {
        showToast('信息修改成功');
        setProfileView('info');
        setUserInfo(null);
        handleFetchUserInfo();
      } else {
        showToast(data.message || '信息修改失败');
      }
    } catch (e) {
      showToast('信息修改失败: ' + e.message);
    } finally {
      setEditLoading(false);
    }
  };

  // 进入个人中心页时自动加载用户信息
  useEffect(() => {
    if (isLoggedIn && activeTab === 'profile' && !userInfo) {
      handleFetchUserInfo();
    }
  }, [activeTab, isLoggedIn]);

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
              {!showRegister ? (
                <>
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
                      <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="输入访问密钥 (密码)" className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-900/50 border border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-lg text-white" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                    </div>
                    <button onClick={handleLogin} className="group w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-500 transition-all transform hover:-translate-y-1 shadow-2xl shadow-emerald-950 flex items-center justify-center gap-3">
                      {isLoading ? "系统验证中..." : "验证身份进入系统"}
                      <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="text-center">
                      <button onClick={() => { setShowRegister(true); setRegisterForm({ username: '', password: '', confirmPassword: '', role: 'consumer' }); }} className="text-slate-400 hover:text-emerald-400 transition-colors text-sm font-medium">
                        没有账号？<span className="text-emerald-500 font-semibold">注册新账号</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-3xl font-extrabold tracking-tight mb-2">创建账号</h3>
                    <p className="text-slate-500">注册一个新的系统账号。</p>
                  </div>
                  <div className="space-y-5">
                    <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                      <input type="text" value={registerForm.username} onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })} placeholder="设置用户名" className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-lg" />
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                      <input type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} placeholder="设置密码（至少6位）" className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-lg text-white" />
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                      <input type="password" value={registerForm.confirmPassword} onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })} placeholder="确认密码" className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-lg text-white" />
                    </div>
                    <div className="relative group">
                      <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors z-10" size={20} />
                      <select value={registerForm.role} onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })} className="w-full pl-14 pr-10 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-lg text-white appearance-none cursor-pointer">
                        <option value="consumer">消费者 — 查看产品、溯源</option>
                        <option value="manufacturer">生产商 — 创建产品、交易</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={20} />
                    </div>
                    <button onClick={handleRegister} className="group w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-500 transition-all transform hover:-translate-y-1 shadow-2xl shadow-emerald-950 flex items-center justify-center gap-3">
                      {registerLoading ? "注册中..." : "注册账号"}
                      <UserPlus size={22} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="text-center">
                      <button onClick={() => setShowRegister(false)} className="text-slate-400 hover:text-emerald-400 transition-colors text-sm font-medium">
                        已有账号？<span className="text-emerald-500 font-semibold">返回登录</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
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
          localStorage.removeItem('dpfs_role');
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
            { key: 'monitor', icon: Monitor, label: '系统监控', desc: '系统状态实时监控' },
            { key: 'profile', icon: User, label: '个人中心', desc: '用户信息管理' },
          ].filter(({ key }) => hasPagePermission(key)).map(({ key, icon: Icon, label, desc }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveTab(key); if (key !== 'profile') setProfileView('info'); }}
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
        <div className={`h-full overflow-y-auto p-12 custom-scrollbar transition-all duration-500 ${(activeTab === 'activity' || activeTab === 'make_trade' || activeTab === 'risk_query' || activeTab === 'monitor' || activeTab === 'profile') ? 'flex-1 bg-slate-50/50' : (activeTab === 'trace' ? 'flex-[0.9]' : 'flex-[1.3]')}`}>
          <div className={`${(activeTab === 'activity' || activeTab === 'make_trade' || activeTab === 'risk_query' || activeTab === 'monitor' || activeTab === 'profile') ? 'max-w-6xl' : 'max-w-3xl'} mx-auto`}>

            {activeTab === 'dashboard' && (
              <>
                {/* 隐藏的文件选择器 */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  style={{ display: 'none' }}
                />
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
                        <input value={row.value || ''} onChange={(e) => updateDynamicRow('baseInfo', row.id, 'value', e.target.value)} className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-medium" placeholder="内容" />
                        <button
                          onClick={() => handleFileUpload(row.id)}
                          disabled={uploadingRowId === row.id}
                          title="上传文件（视频等）"
                          className="p-3 text-slate-300 hover:text-emerald-500 transition-colors disabled:opacity-50"
                        >
                          {uploadingRowId === row.id ? <RefreshCw size={20} className="animate-spin" /> : <Upload size={20} />}
                        </button>
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
                <header className="mb-10">
                  <span className="text-[10px] font-black tracking-[0.3em] text-emerald-600 uppercase mb-2 block">Product Traceability</span>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">商品溯源</h2>
                  <p className="text-sm text-slate-400 mt-2">输入溯源代码，追踪商品从原料到成品的完整链路</p>
                </header>

                <div className="space-y-6">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100/80">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <Search size={16} className="text-emerald-600" />
                      </div>
                      <h3 className="font-bold text-base text-slate-800">溯源查询</h3>
                    </div>

                    <label className="block text-xs font-semibold text-slate-500 mb-2">商品溯源代码</label>
                    <div className="relative mb-6">
                      <input
                        value={traceForm.traceCode}
                        onChange={(e) => setTraceForm({ ...traceForm, traceCode: e.target.value })}
                        className="w-full pl-10 pr-6 py-4 rounded-xl bg-slate-50/80 border border-slate-200/60 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all font-mono font-semibold text-slate-700 placeholder:text-slate-300"
                        placeholder="输入20位溯源码"
                      />
                      <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>

                    <label className="block text-xs font-semibold text-slate-500 mb-3">查询选项</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                      {[
                        { key: 'traceDetail', title: '详细交易信息', desc: '包含交易流转记录', icon: Activity },
                        { key: 'ingreDetail', title: '详细配料信息', desc: '配料溯源树与占比', icon: ListChecks },
                        { key: 'aiRisk', title: 'AI个性化评估', desc: '智能分析报告', icon: ShieldCheck }
                      ].map((opt) => {
                        const Icon = opt.icon;
                        const active = traceForm[opt.key];
                        return (
                          <div
                            key={opt.key}
                            onClick={() => setTraceForm({ ...traceForm, [opt.key]: !active })}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all group ${active ? 'border-emerald-400 bg-emerald-50/60 shadow-sm shadow-emerald-100' : 'border-slate-100 bg-white hover:border-emerald-200 hover:shadow-sm'}`}
                          >
                            <div className="flex items-center gap-2.5 mb-1.5">
                              <Icon size={14} className={`transition-colors ${active ? 'text-emerald-600' : 'text-slate-300 group-hover:text-emerald-400'}`} />
                              <span className={`text-sm font-bold transition-colors ${active ? 'text-emerald-700' : 'text-slate-500'}`}>{opt.title}</span>
                            </div>
                            <p className={`text-[11px] pl-[22px] transition-colors ${active ? 'text-emerald-500/70' : 'text-slate-300'}`}>{opt.desc}</p>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleTrace}
                      disabled={isLoading}
                      className="w-full py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-bold text-base hover:from-emerald-600 hover:to-emerald-700 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-slate-200/80 hover:shadow-emerald-200/80 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={18} />}
                      {isLoading ? '溯源扫描中...' : '开始溯源'}
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
                              <div
                                className="font-mono text-[11px] text-emerald-600/80 bg-emerald-50/60 px-3 py-1 rounded-lg cursor-pointer select-all hover:bg-emerald-100 transition-colors"
                                title={item.trace_code_prefix}
                                onClick={(e) => { e.stopPropagation(); try { const ta = document.createElement('textarea'); ta.value = item.trace_code_prefix; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); showToast('溯源码已复制'); } catch(err) { showToast('复制失败'); } }}
                              >
                                {item.trace_code_prefix}
                              </div>
                            </div>
                            <button
                              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all"
                              title="查看已上传文件"
                              onClick={(e) => { e.stopPropagation(); handleFetchFiles(item); }}
                            >
                              <Eye size={16} />
                            </button>
                            {hasDropPermission() && (
                              <button
                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                title="删除此产品"
                                onClick={(e) => { e.stopPropagation(); setDropModal({ open: true, item }); }}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
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

            {activeTab === 'monitor' && (
              <div className="animate-in fade-in duration-500 h-full flex flex-col" style={{gap:'10px'}}>

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-1 pb-2" style={{borderBottom:'1px solid rgba(16,185,129,.12)'}}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{background:'linear-gradient(135deg,rgba(16,185,129,.15),rgba(6,182,212,.1))'}}>
                      <Monitor size={18} className="text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-800 tracking-wide" style={{fontFamily:'Orbitron,sans-serif'}}>SYSTEM MONITOR</h2>
                      <p className="text-[10px] text-slate-400 tracking-wider uppercase">实时监控 · 运行状态 · 性能指标</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-emerald-500 text-[11px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{boxShadow:'0 0 8px rgba(16,185,129,.6)'}}></span>
                      {monitorAutoRefresh ? 'LIVE 5s' : 'PAUSED'}
                    </div>
                    <button
                      onClick={() => setMonitorAutoRefresh(!monitorAutoRefresh)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 border ${monitorAutoRefresh ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5' : 'border-slate-200 text-slate-400 bg-slate-50'}`}
                    >
                      <RefreshCw size={12} className={monitorAutoRefresh && monitorLoading ? 'animate-spin' : ''} />
                      {monitorAutoRefresh ? '自动' : '手动'}
                    </button>
                    <button onClick={fetchMonitorData} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 text-white hover:bg-emerald-600 transition-all flex items-center gap-1.5 shadow-md">
                      <RefreshCw size={12} className={monitorLoading ? 'animate-spin' : ''} />
                      刷新
                    </button>
                    {monitorData && <span className="text-[10px] text-slate-300 font-mono">{new Date().toLocaleTimeString('zh-CN',{hour12:false})}</span>}
                  </div>
                </div>

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-4" style={{gap:'10px'}}>
                  {[
                    { label: '总产品数', value: monitorData?.total_products ?? '-', sub: 'Total Products', color: 'from-cyan-500/20 to-blue-500/10', accent: 'text-cyan-600', border: 'rgba(6,182,212,.2)', icon: <Box size={16} className="text-cyan-500" /> },
                    { label: '风险产品', value: monitorData?.risk_products ?? '-', sub: 'Risk Products', color: 'from-rose-500/15 to-red-500/5', accent: (monitorData?.risk_products ?? 0) > 0 ? 'text-rose-600' : 'text-slate-700', border: (monitorData?.risk_products ?? 0) > 0 ? 'rgba(244,63,94,.25)' : 'rgba(16,185,129,.1)', icon: <AlertTriangle size={16} className={(monitorData?.risk_products ?? 0) > 0 ? 'text-rose-500' : 'text-slate-400'} /> },
                    { label: '溯源查询', value: monitorData?.trace_count_per_min ?? '-', sub: 'Queries / min', color: 'from-emerald-500/15 to-teal-500/5', accent: 'text-emerald-600', border: 'rgba(16,185,129,.2)', icon: <Search size={16} className="text-emerald-500" /> },
                    { label: '系统报错', value: monitorData?.error_count ?? '-', sub: 'Last 1 Hour', color: (monitorData?.error_count ?? 0) > 0 ? 'from-amber-500/15 to-orange-500/5' : 'from-slate-100 to-slate-50', accent: (monitorData?.error_count ?? 0) > 0 ? 'text-amber-600' : 'text-slate-700', border: (monitorData?.error_count ?? 0) > 0 ? 'rgba(245,158,11,.2)' : 'rgba(16,185,129,.1)', icon: <AlertTriangle size={16} className={(monitorData?.error_count ?? 0) > 0 ? 'text-amber-500' : 'text-slate-400'} /> },
                  ].map((card, i) => (
                    <div key={i} className="relative overflow-hidden rounded-xl p-4 transition-all hover:shadow-lg" style={{background:`linear-gradient(135deg,${i%2===0?'rgba(255,255,255,.95)':'rgba(248,250,252,.95)'})`,border:`1px solid ${card.border}`}}>
                      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.color}`}></div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</span>
                        {card.icon}
                      </div>
                      <div className={`text-3xl font-black ${card.accent} leading-none`} style={{fontFamily:'Orbitron,sans-serif'}}>{card.value}</div>
                      <div className="text-[10px] text-slate-300 mt-1.5 font-mono uppercase tracking-wider">{card.sub}</div>
                    </div>
                  ))}
                </div>

                {/* ── Middle: Chart + Chart + Resources ── */}
                <div className="grid grid-cols-3 flex-1 min-h-0" style={{gap:'10px'}}>
                  {/* 左侧：溯源查询折线图 */}
                  <div className="rounded-xl p-4 flex flex-col min-h-0" style={{background:'linear-gradient(135deg,rgba(255,255,255,.97),rgba(248,250,252,.95))',border:'1px solid rgba(16,185,129,.1)'}}>
                    <div className="flex items-center justify-between mb-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <Activity size={14} className="text-emerald-500" />
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">溯源查询趋势</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        <span className="text-[10px] text-rose-500 font-bold">LIVE 5s</span>
                        <span className="text-[10px] text-slate-300 font-mono ml-2">{traceHistory.length} pts</span>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0">
                      <TraceLineChart data={traceHistory} />
                    </div>
                  </div>

                  {/* 中间：交易统计折线图 */}
                  <div className="rounded-xl p-4 flex flex-col min-h-0" style={{background:'linear-gradient(135deg,rgba(255,255,255,.97),rgba(248,250,252,.95))',border:'1px solid rgba(16,185,129,.1)'}}>
                    <div className="flex items-center justify-between mb-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <Plus size={14} className="text-blue-500" />
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">交易统计趋势</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        <span className="text-[10px] text-rose-500 font-bold">LIVE 5s</span>
                        <span className="text-[10px] text-slate-300 font-mono ml-2">{tradeHistory.length} pts</span>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0">
                      <TraceLineChart data={tradeHistory} />
                    </div>
                  </div>

                  {/* 右侧：系统负载 */}
                  <div className="rounded-xl p-4 flex flex-col min-h-0" style={{background:'linear-gradient(135deg,rgba(255,255,255,.97),rgba(248,250,252,.95))',border:'1px solid rgba(16,185,129,.1)'}}>
                    <div className="flex items-center gap-2 mb-4 shrink-0">
                      <Cpu size={14} className="text-blue-500" />
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">系统资源</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-5">
                      {[
                        { label: 'CPU', val: monitorData?.cpu_usage ?? 0, color: ['#06b6d4','#3b82f6'], icon: <Cpu size={13} className="text-cyan-500" /> },
                        { label: 'MEM', val: monitorData?.mem_usage_percent ?? 0, color: ['#8b5cf6','#6366f1'], icon: <MemoryStick size={13} className="text-violet-500" />, detail: monitorData ? `${((monitorData.mem_total_kb - monitorData.mem_available_kb)/1024/1024).toFixed(1)} / ${(monitorData.mem_total_kb/1024/1024).toFixed(1)} GB` : '' },
                        { label: 'DISK', val: monitorData?.disk_usage_percent ?? 0, color: ['#10b981','#14b8a6'], icon: <HardDrive size={13} className="text-emerald-500" />, detail: monitorData ? `${(monitorData.disk_used_kb/1024/1024).toFixed(1)} / ${(monitorData.disk_total_kb/1024/1024).toFixed(1)} GB` : '' },
                      ].map((g, i) => {
                        const pct = Math.min(g.val, 100);
                        const isWarn = pct > 80;
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">{g.icon}<span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider w-10">{g.label}</span></div>
                              <span className="text-sm font-black" style={{color: isWarn ? '#ef4444' : g.color[0],fontFamily:'Orbitron,sans-serif'}}>{g.val.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-5 rounded-md overflow-hidden" style={{background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.08)'}}>
                              <div className="h-full rounded-md transition-all duration-700 relative" style={{width:`${pct}%`,background: isWarn ? 'rgba(239,68,68,.7)' : `linear-gradient(90deg,${g.color[0]},${g.color[1]})`}}>
                                <div className="absolute inset-0" style={{background:'repeating-linear-gradient(-45deg,transparent,transparent 4px,rgba(255,255,255,.04) 4px,rgba(255,255,255,.04) 8px)'}}></div>
                              </div>
                            </div>
                            {g.detail && <div className="text-[9px] text-slate-300 font-mono mt-1">{g.detail}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Bottom: Response Time + Online Users ── */}
                <div className="grid grid-cols-3" style={{gap:'10px'}}>
                  {/* 响应时间 */}
                  <div className="rounded-xl p-4" style={{background:'linear-gradient(135deg,rgba(255,255,255,.97),rgba(248,250,252,.95))',border:'1px solid rgba(16,185,129,.1)'}}>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={13} className="text-violet-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">响应时间</span>
                    </div>
                    <div className="flex items-end gap-1.5">
                      <span className="text-2xl font-black text-slate-800" style={{fontFamily:'Orbitron,sans-serif'}}>{monitorData?.response_time_ms?.toFixed(1) ?? '-'}</span>
                      <span className="text-xs text-slate-400 mb-0.5 font-mono">ms</span>
                    </div>
                    <div className="w-full h-2 rounded-full mt-2.5 overflow-hidden" style={{background:'rgba(16,185,129,.06)'}}>
                      <div className={`h-full rounded-full transition-all duration-500 ${(monitorData?.response_time_ms ?? 0) < 100 ? 'bg-emerald-500' : (monitorData?.response_time_ms ?? 0) < 500 ? 'bg-amber-400' : 'bg-red-500'}`} style={{width:`${Math.min((monitorData?.response_time_ms ?? 0) / 10, 100)}%`}}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-[8px] text-slate-300 font-mono"><span>FAST</span><span>100ms</span><span>500ms</span><span>SLOW</span></div>
                  </div>

                  {/* 在线用户 */}
                  <div className="rounded-xl p-4" style={{background:'linear-gradient(135deg,rgba(255,255,255,.97),rgba(248,250,252,.95))',border:'1px solid rgba(16,185,129,.1)'}}>
                    <div className="flex items-center gap-2 mb-2">
                      <User size={13} className="text-cyan-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">在线用户</span>
                    </div>
                    <div className="flex items-end gap-1.5">
                      <span className="text-2xl font-black text-slate-800" style={{fontFamily:'Orbitron,sans-serif'}}>{monitorData?.active_users ?? '-'}</span>
                      <span className="text-xs text-slate-400 mb-0.5 font-mono">sessions</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{boxShadow:'0 0 6px rgba(16,185,129,.5)'}}></span>
                      <span className="text-[10px] text-emerald-600 font-bold">ACTIVE</span>
                    </div>
                  </div>

                  {/* 系统状态 */}
                  <div className="rounded-xl p-4" style={{background:'linear-gradient(135deg,rgba(255,255,255,.97),rgba(248,250,252,.95))',border:'1px solid rgba(16,185,129,.1)'}}>
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck size={13} className="text-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">系统状态</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" style={{boxShadow:'0 0 10px rgba(16,185,129,.4)'}}></span>
                      <span className="text-lg font-black text-emerald-600" style={{fontFamily:'Orbitron,sans-serif'}}>NOMINAL</span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-mono mt-1.5">All systems operational</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                <header className="mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {profileView !== 'info' && (
                        <button
                          onClick={() => setProfileView('info')}
                          className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all"
                        >
                          <ChevronLeft size={16} />
                        </button>
                      )}
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                        {profileView === 'info' ? <User size={20} /> : profileView === 'password' ? <Lock size={20} /> : <Pencil size={20} />}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                          {profileView === 'info' ? '个人中心' : profileView === 'password' ? '修改密码' : '修改信息'}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {profileView === 'info' ? '查看账户信息与安全设置' : profileView === 'password' ? '更新账户登录密码' : '编辑个人基础信息'}
                        </p>
                      </div>
                    </div>
                    {profileView === 'info' && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setProfileView('edit');
                            setEditForm({ real_name: userInfo?.real_name || '', phone: userInfo?.phone || '', mail: userInfo?.mail || '', description: userInfo?.description || '' });
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                          <Pencil size={14} />
                          修改信息
                        </button>
                        <button
                          onClick={() => { setProfileView('password'); setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200"
                        >
                          <Lock size={14} />
                          修改密码
                        </button>
                      </div>
                    )}
                  </div>
                </header>

                {profileView === 'info' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 左栏：头像 + 基础信息 */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">基础信息</span>
                      </div>
                      <div className="p-6">
                        {userInfo ? (
                          <div>
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-500/20">
                                {(userInfo.real_name || userInfo.username || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 text-lg">{userInfo.real_name || userInfo.username}</div>
                                <div className="text-xs text-slate-400">@{userInfo.username} · ID: {userInfo.uid}</div>
                              </div>
                            </div>
                            {[
                              { label: '用户名', value: userInfo.username, icon: '👤' },
                              { label: '姓名', value: userInfo.real_name || '—', icon: '🧑' },
                              { label: '角色', value: userInfo.role === 'admin' ? '管理员' : userInfo.role, icon: '🔑' },
                              { label: '个人描述', value: userInfo.description || '—', icon: '📝' },
                            ].map((item) => (
                              <div key={item.label} className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
                                <span className="text-sm mt-0.5">{item.icon}</span>
                                <span className="text-xs font-bold text-slate-400 w-16 shrink-0 pt-0.5">{item.label}</span>
                                <span className="text-sm font-semibold text-slate-700 break-all">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-8 text-slate-400">
                            <RefreshCw size={16} className="animate-spin mr-2" />
                            加载中...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 右栏：联系信息 + 系统信息 */}
                    {userInfo && (
                      <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                          <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                            <span className="text-sm">📱</span>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">联系方式</span>
                          </div>
                          <div className="p-6">
                            {[
                              { label: '手机号', value: userInfo.phone || '—', icon: '📱' },
                              { label: '邮箱', value: userInfo.mail || '—', icon: '📧' },
                            ].map((item) => (
                              <div key={item.label} className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
                                <span className="text-sm mt-0.5">{item.icon}</span>
                                <span className="text-xs font-bold text-slate-400 w-16 shrink-0 pt-0.5">{item.label}</span>
                                <span className="text-sm font-semibold text-slate-700 break-all">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                          <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                            <span className="text-sm">⚙️</span>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">系统信息</span>
                          </div>
                          <div className="p-6">
                            {[
                              { label: '账户状态', value: userInfo.status === 'active' ? '✅ 正常' : userInfo.status, icon: '🛡️' },
                              { label: '上次登录', value: userInfo.last_login || '—', icon: '🕐' },
                              { label: '创建时间', value: userInfo.created_at || '—', icon: '📅' },
                            ].map((item) => (
                              <div key={item.label} className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
                                <span className="text-sm mt-0.5">{item.icon}</span>
                                <span className="text-xs font-bold text-slate-400 w-16 shrink-0 pt-0.5">{item.label}</span>
                                <span className="text-sm font-semibold text-slate-700 break-all">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {profileView === 'edit' && (
                  <div className="max-w-lg">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                        <Pencil size={14} className="text-blue-500" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">编辑信息</span>
                      </div>
                      <div className="p-6 space-y-5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 ml-1">姓名</label>
                          <input
                            type="text"
                            value={editForm.real_name}
                            onChange={(e) => setEditForm({ ...editForm, real_name: e.target.value })}
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium text-slate-700"
                            placeholder="输入真实姓名"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 ml-1">手机号</label>
                          <input
                            type="text"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium text-slate-700"
                            placeholder="输入手机号"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 ml-1">邮箱</label>
                          <input
                            type="text"
                            value={editForm.mail}
                            onChange={(e) => setEditForm({ ...editForm, mail: e.target.value })}
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium text-slate-700"
                            placeholder="输入邮箱地址"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 ml-1">个人描述</label>
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            rows={3}
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium text-slate-700 resize-none"
                            placeholder="输入个人描述"
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => setProfileView('info')}
                            className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleUpdateUserInfo}
                            disabled={editLoading}
                            className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {editLoading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                            保存修改
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {profileView === 'password' && (
                  <div className="max-w-lg">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                        <Lock size={14} className="text-amber-500" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">修改密码</span>
                      </div>
                      <div className="p-6 space-y-5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 ml-1">当前密码</label>
                          <input
                            type="password"
                            value={pwdForm.oldPassword}
                            onChange={(e) => setPwdForm({ ...pwdForm, oldPassword: e.target.value })}
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium text-slate-700"
                            placeholder="输入当前密码"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 ml-1">新密码</label>
                          <input
                            type="password"
                            value={pwdForm.newPassword}
                            onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium text-slate-700"
                            placeholder="输入新密码（至少4位）"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 ml-1">确认新密码</label>
                          <input
                            type="password"
                            value={pwdForm.confirmPassword}
                            onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all text-sm font-medium text-slate-700"
                            placeholder="再次输入新密码"
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => setProfileView('info')}
                            className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleUpdatePassword}
                            disabled={pwdLoading}
                            className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {pwdLoading ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                            确认修改
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
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
          <div className="flex-[1.35] h-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 flex flex-col relative text-white animate-in slide-in-from-right-full duration-500">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            <div className="relative z-10 h-full flex flex-col">
              <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <Activity size={18} className={isLoading ? 'animate-pulse' : ''} />
                  <span className="text-[11px] font-mono font-bold tracking-[0.3em] uppercase">Trace Engine</span>
                </div>
                {!isLoading && traceResults.traceResult && (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-500/60 font-mono">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    SCANNED
                  </div>
                )}
              </header>

              <div className="flex-1 bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 flex flex-col overflow-hidden">
                {isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="relative mb-8">
                      <div className="w-24 h-24 border-2 border-emerald-500/10 border-t-emerald-400 rounded-full animate-spin"></div>
                      <Cpu size={40} className="absolute inset-0 m-auto text-emerald-400 animate-pulse" />
                    </div>
                    <h4 className="text-emerald-400/90 font-mono text-sm tracking-[0.3em] animate-pulse">DPFS TRACE SCANNING</h4>
                    <p className="text-slate-500 text-xs mt-2">正在解析溯源链路...</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-700">
                    <div className="flex items-center gap-2.5 mb-5 shrink-0">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 border border-emerald-500/10">
                        <ListChecks size={16} />
                      </div>
                      <h3 className="text-base font-bold text-white/90">溯源结果</h3>
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col gap-4">
                      {/* 溯源详情 */}
                      <div className="flex-1 min-h-0 bg-white/[0.02] rounded-xl p-5 border border-white/[0.04] overflow-y-auto custom-scrollbar">
                        {renderTraceResult(traceResults.traceResult)}
                      </div>

                      {/* 元配料整合表 */}
                      {traceResults.metaIngredients && traceResults.metaIngredients.length > 0 && (
                        <div className="shrink-0 bg-white/[0.02] rounded-xl p-5 border border-white/[0.04]">
                          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-400/70 mb-3 flex items-center gap-2">
                            <ShieldCheck size={11} /> 元配料整合表
                          </div>
                          <div className="space-y-2">
                            {traceResults.metaIngredients.map((item, idx) => {
                              const pctNum = parseFloat(item.percentage) || 0;
                              return (
                                <div key={idx} className="flex items-center gap-3">
                                  <span className="text-xs font-semibold text-slate-200 w-20 shrink-0 truncate" title={item.name}>{item.name}</span>
                                  <div className="flex-1 h-4 bg-white/[0.04] rounded-full overflow-hidden relative">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-amber-500/70 to-amber-400/50 transition-all duration-700"
                                      style={{ width: `${Math.min(pctNum, 100)}%` }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/80 font-mono">
                                      {item.percentage}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-mono font-semibold text-amber-400/70 w-14 text-right shrink-0">{item.grams}g</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* AI 风险评估 */}
                      {traceForm.aiRisk && (
                        <div className="flex-1 min-h-0 bg-white/[0.02] rounded-xl p-5 border border-white/[0.04] overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scrollbar">
                          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-400/70 mb-3 flex items-center gap-2">
                            <ShieldCheck size={11} className="text-blue-400/70" /> AI 个性化评估
                          </div>
                          <div className="font-mono text-xs text-blue-300/80 leading-relaxed">{traceResults.aiRiskReport}</div>
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

      {/* 删除产品确认弹窗 */}
      {dropModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl border border-slate-100 transform animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">确认删除？</h3>
            <p className="text-slate-500 mb-2 text-center text-sm">
              即将删除溯源产品：
            </p>
            <div className="bg-slate-50 rounded-xl px-4 py-3 mb-6 text-center">
              <div className="font-bold text-slate-800 text-sm">{dropModal.item?.product_name}</div>
              <div className="text-xs text-slate-400 mt-1">{dropModal.item?.group_name}</div>
            </div>
            <p className="text-red-500/70 text-xs text-center mb-6">此操作不可撤销，产品及其关联数据将被永久删除</p>
            <div className="flex gap-4">
              <button
                onClick={() => setDropModal({ open: false, item: null })}
                disabled={dropLoading}
                className="flex-1 py-4 rounded-2xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-50"
              >取消</button>
              <button
                onClick={handleDropTracablePro}
                disabled={dropLoading}
                className="flex-1 py-4 rounded-2xl bg-red-600 font-bold text-white hover:bg-red-700 shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {dropLoading ? <><RefreshCw size={16} className="animate-spin" /> 删除中...</> : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 文件列表弹窗 */}
      {fileModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 transform animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <Film size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">文件资源</h3>
                  <p className="text-xs text-slate-400">
                    {fileModal.item?.product_name} · {fileModal.item?.group_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setFileModal({ open: false, item: null, files: [], loading: false }); setViewingFile(null); }}
                className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video/Image viewer */}
            {viewingFile && (
              <div className="mb-4 border border-slate-100 rounded-2xl overflow-hidden bg-slate-950">
                {isVideoFile(viewingFile.name) ? (
                  <video
                    controls
                    autoPlay
                    className="w-full max-h-80"
                    src={`/api/serve_file?path=${encodeURIComponent(viewingFile.path)}`}
                  >
                    您的浏览器不支持视频播放
                  </video>
                ) : isImageFile(viewingFile.name) ? (
                  <img
                    src={`/api/serve_file?path=${encodeURIComponent(viewingFile.path)}`}
                    alt={viewingFile.name}
                    className="w-full max-h-80 object-contain"
                  />
                ) : null}
                <div className="px-4 py-2 bg-slate-900 text-white text-xs flex items-center justify-between">
                  <span className="truncate mr-2">{viewingFile.name}</span>
                  <button
                    onClick={async () => {
                      try {
                        const url = `/api/serve_file?path=${encodeURIComponent(viewingFile.path)}`;
                        const response = await fetch(url);
                        if (!response.ok) throw new Error('HTTP ' + response.status);
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = viewingFile.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(blobUrl);
                        showToast('下载成功');
                      } catch (err) {
                        console.error('Download error:', err);
                        showToast('下载失败: ' + err.message);
                      }
                    }}
                    className="shrink-0 px-3 py-1 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-all flex items-center gap-1 text-[10px] font-bold"
                  >
                    <Download size={12} /> 下载
                  </button>
                </div>
              </div>
            )}

            {/* File list */}
            <div className="flex-1 overflow-y-auto -mx-2 px-2">
              {fileModal.loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <RefreshCw size={24} className="animate-spin mr-2" />
                  加载文件列表...
                </div>
              ) : fileModal.files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <File size={40} className="mb-3 text-slate-200" />
                  <div className="font-semibold">暂无文件</div>
                  <div className="text-xs mt-1">该商品尚未上传任何文件</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {fileModal.files.map((f, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border ${
                        viewingFile?.path === f.path
                          ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                          : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'
                      }`}
                      onClick={() => setViewingFile({ name: f.name, path: f.path })}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isVideoFile(f.name) ? 'bg-purple-100 text-purple-600' :
                        isImageFile(f.name) ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-200 text-slate-500'
                      }`}>
                        {isVideoFile(f.name) ? <Play size={16} /> :
                         isImageFile(f.name) ? <Eye size={16} /> :
                         <File size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-slate-700 truncate">{f.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {f.size > 1024*1024 ? `${(f.size/1024/1024).toFixed(1)} MB` :
                           f.size > 1024 ? `${(f.size/1024).toFixed(1)} KB` : `${f.size} B`}
                          {isVideoFile(f.name) && ' · 视频'}
                          {isImageFile(f.name) && ' · 图片'}
                        </div>
                      </div>
                      {isVideoFile(f.name) || isImageFile(f.name) ? (
                        <Play size={14} className="text-slate-300 shrink-0" />
                      ) : (
                        <Download size={14} className="text-slate-300 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
