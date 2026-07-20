import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, LogOut, ShieldCheck, ShieldAlert, Activity, Cpu,
  CheckCircle, Box, ListChecks, ArrowRight,
  User, Lock, LayoutDashboard, Zap, Search, ChevronRight,
  RefreshCw, ChevronLeft, Check, Pencil, Save, Hash, Upload, FileText,
  Play, Film, File, Download, X, Eye, UserPlus, ChevronDown,
  Users, Monitor, HardDrive, MemoryStick, Clock, AlertTriangle, Home
} from 'lucide-react';
import ParticleBackground from './ParticleBackground';
import ChatPanel from './ChatPanel';

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

// --- 子组件：会话过期弹窗 ---
const SessionExpiredModal = ({ isOpen, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300 p-4">
      <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl border border-slate-100 transform animate-in zoom-in-95">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6 mx-auto">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">会话已过期</h3>
        <p className="text-slate-500 mb-8 text-center">您的登录状态已超时，请重新登录。</p>
        <button onClick={onConfirm} className="w-full py-4 rounded-2xl bg-slate-900 font-bold text-white hover:bg-emerald-600 shadow-xl transition-all">重新登录</button>
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
    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const pad = { top: 16, right: 16, bottom: 24, left: 40 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    // Y 轴数据范围
    const values = data.map(d => d.count);
    let maxVal = Math.max(...values, 1);
    maxVal = Math.ceil(maxVal * 1.2);
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

    // ── 时间窗口：固定5分钟，用于 X 轴标签 ──
    const WINDOW = 5 * 60 * 1000;
    const lastTs = data[data.length - 1].ts;
    const firstTs = data[0].ts;
    const dataSpan = lastTs - firstTs;
    const winStart = dataSpan >= WINDOW ? lastTs - WINDOW : firstTs;
    const winEnd = lastTs;
    const winDuration = Math.max(winEnd - winStart, 1000);

    // 数据点均匀分布（索引定位），不依赖实际采集间隔
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

    // 数据点圆点 — 所有点统一可见，仅最后一个加高亮
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const isLast = i === points.length - 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, isLast ? 4 : 2, 0, Math.PI * 2);
      ctx.fillStyle = isLast ? '#059669' : 'rgba(16,185,129,0.7)';
      ctx.fill();
      if (isLast) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // ── X 轴标签：均匀分布，显示实际时间 ──
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    const maxLabels = 6;
    // 计算标签间隔：每隔 N 个数据点显示一个
    const labelInterval = Math.max(Math.ceil(data.length / maxLabels), 1);
    const minGap = 35;
    let lastDrawnX = -Infinity;
    for (let i = 0; i < data.length; i += labelInterval) {
      const x = points[i].x;
      if (x - lastDrawnX < minGap) continue;
      const d = new Date(data[i].ts);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      const label = data.length > 30 ? `${hh}:${mm}` : `${hh}:${mm}:${ss}`;
      ctx.fillText(label, x, pad.top + chartH + 18);
      lastDrawnX = x;
    }
    // 始终显示最后一个标签
    if (data.length > 1) {
      const lastX = points[data.length - 1].x;
      if (lastX - lastDrawnX >= minGap) {
        const d = new Date(data[data.length - 1].ts);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        ctx.fillText(data.length > 30 ? `${hh}:${mm}` : `${hh}:${mm}:${ss}`, lastX, pad.top + chartH + 18);
      }
    }

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
    home:        null,
    dashboard:   'product:risk:create',
    trace:       'product:trace',
    make_trade:  'trade:create',
    activity:    'product:list',
    risk_query:  'product:risk:view',
    monitor:     'system:monitor:view',
    users:       'system:user:manage',
    profile:     null,
  };
  // 角色权限表（与后端 role_permissions 表一致）
  const ROLE_PERMISSIONS = {
    admin:        ['*'],
    supervisor:   ['product:list', 'product:drop', 'product:trace', 'product:risk:view', 'system:audit:view', 'system:monitor:view'],
    manufacturer: ['product:list', 'product:trace', 'product:risk:create', 'trade:create'],
    consumer:     ['product:list', 'product:trace'],
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
  const [showSessionModal, setShowSessionModal] = useState(false);
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
  const [systemSearchName, setSystemSearchName] = useState('');
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [traceHistory, setTraceHistory] = useState([]); // [{time, count}]
  const traceHistoryRef = useRef([]); // ref for timer closure
  const [tradeHistory, setTradeHistory] = useState([]); // [{time, count}]
  const tradeHistoryRef = useRef([]);

  // --- 健康食品推荐 ---
  const [recommendations, setRecommendations] = useState([]);
  const [recommendTip, setRecommendTip] = useState('');
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [logData, setLogData] = useState([]); // [{time, level, msg}]
  const logHistoryRef = useRef([]);

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

  const [activeTab, setActiveTab] = useState('home');

  // 获取用户首页（导航栏第一个有权限的页面）
  const getUserHomePage = () => {
    return ['home','dashboard','trace','make_trade','activity','risk_query','monitor','users','profile']
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
    if (!token) return showToast("请先登录");

    // 前端校验
    if (!formData.productName?.trim()) return showToast("请输入商品全称");
    const qty = parseInt(formData.quantity);
    if (!qty || qty <= 0) return showToast("批次数量必须为大于0的整数");
    const validIngredients = formData.ingredients.filter(i => i.name?.trim());
    if (validIngredients.length === 0) return showToast("请至少添加一种成分");

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

      if (checkApiSession(result)) return;

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
    setTimeout(() => setToast({ show: false, message: '' }), 5000);
  };

  // 统一会话超时处理：检测 API 返回 code=401，弹出模态框引导重新登录
  const handleSessionExpired = () => {
    localStorage.removeItem('dpfs_token');
    localStorage.removeItem('dpfs_role');
    setShowSessionModal(true);
  };

  const checkApiSession = (data) => {
    if (data && Number(data.code) === 401) {
      handleSessionExpired();
      return true;
    }
    return false;
  };

  // --- 健康食品推荐获取 ---
  const fetchRecommendations = async () => {
    const token = localStorage.getItem('dpfs_token');
    if (!token) return;
    setRecommendLoading(true);
    try {
      const response = await fetch('http://192.168.34.65:20520/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_token: parseInt(token) })
      });
      const result = await response.json();
      if (result.code === 200 && result.data) {
        setRecommendations(result.data.recommendations || []);
        setRecommendTip(result.data.tips || '');
      }
    } catch (error) {
      console.error('获取推荐失败:', error);
    } finally {
      setRecommendLoading(false);
    }
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
        // 记录溯源查询历史 (保留最近5分钟数据)
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('zh-CN', { hour12: false });
        const ts = now.getTime();
        const cutoff = ts - 5 * 60 * 1000; // 5分钟前
        const newEntry = { time: timeLabel, ts, count: result.trace_count_per_min || 0 };
        traceHistoryRef.current = [...traceHistoryRef.current.filter(d => d.ts > cutoff), newEntry];
        setTraceHistory([...traceHistoryRef.current]);
        // 记录交易统计历史
        const tradeEntry = { time: timeLabel, ts, count: result.trade_count_per_min || 0 };
        tradeHistoryRef.current = [...tradeHistoryRef.current.filter(d => d.ts > cutoff), tradeEntry];
        setTradeHistory([...tradeHistoryRef.current]);
      }
    } catch (err) {
      console.error('Monitor fetch error:', err);
    } finally {
      setMonitorLoading(false);
    }
  };

  // 监控页面自动刷新 (每5秒) — 图表数据始终采集，日志仅在监控页显示
  useEffect(() => {
    if (!isLoggedIn) return;
    // 图表数据始终采集，避免切换tab时时间轴出现断档
    fetchMonitorData();
    if (!monitorAutoRefresh) return;
    const interval = setInterval(() => { fetchMonitorData(); }, 5000);
    return () => clearInterval(interval);
  }, [isLoggedIn, monitorAutoRefresh]);

  // 主页时钟（每秒更新）
  useEffect(() => {
    if (!isLoggedIn || activeTab !== 'home') return;
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, [isLoggedIn, activeTab]);

  // 日志仅在监控页显示时获取
  useEffect(() => {
    if (!isLoggedIn || activeTab !== 'monitor') return;
    fetchLogsData();
    if (!monitorAutoRefresh) return;
    const interval = setInterval(() => { fetchLogsData(); }, 5000);
    return () => clearInterval(interval);
  }, [isLoggedIn, activeTab, monitorAutoRefresh]);

  // --- 日志数据获取 ---
  const fetchLogsData = async () => {
    const token = localStorage.getItem('dpfs_token');
    if (!token) return;
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_token: parseInt(token), lines: 50 })
      });
      const result = await response.json();
      if (result.code === 200 && result.logs) {
        logHistoryRef.current = result.logs;
        setLogData([...logHistoryRef.current]);
      }
    } catch (err) {
      // silent
    }
  };

  // ─── 用户管理状态 ───
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userDialogMode, setUserDialogMode] = useState('create'); // 'create' | 'edit' | 'resetPwd'
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '', password: '', role: 'consumer', real_name: '', phone: '', mail: '', description: '', status: 'active'
  });
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());

  const fetchUsersList = async () => {
    const token = localStorage.getItem('dpfs_token');
    if (!token) return;
    setUsersLoading(true);
    try {
      const response = await fetch('/api/admin/users/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_token: parseInt(token) })
      });
      const result = await response.json();
      if (result.code === 200) { setUsersList(result.users || []); setSelectedUserIds(new Set()); }
    } catch (err) { /* silent */ }
    setUsersLoading(false);
  };

  // 点击导航到用户管理页时自动加载
  useEffect(() => {
    if (isLoggedIn && activeTab === 'users') fetchUsersList();
  }, [isLoggedIn, activeTab]);

  const openCreateDialog = () => {
    setUserDialogMode('create');
    setEditingUserId(null);
    setUserForm({ username: '', password: '', role: 'consumer', real_name: '', phone: '', mail: '', description: '', status: 'active' });
    setShowUserDialog(true);
  };

  const openEditDialog = (user) => {
    setUserDialogMode('edit');
    setEditingUserId(user.id);
    setUserForm({ role: user.role, real_name: user.real_name || '', phone: user.phone || '', mail: user.mail || '', description: '', status: user.status || 'active' });
    setShowUserDialog(true);
  };

  const openResetPwdDialog = (user) => {
    setUserDialogMode('resetPwd');
    setEditingUserId(user.id);
    setUserForm({ username: user.name, password: '', role: '', real_name: '', phone: '', mail: '', description: '', status: '' });
    setShowUserDialog(true);
  };

  const handleUserFormChange = (field, value) => {
    setUserForm({ ...userForm, [field]: value });
  };

  const submitUserForm = async () => {
    const token = localStorage.getItem('dpfs_token');
    if (!token) return;

    if (userDialogMode === 'create') {
      if (!userForm.username || !userForm.password || !userForm.role) {
        showToast('请填写用户名、密码和角色');
        return;
      }
      try {
        const response = await fetch('/api/admin/users/create', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_token: parseInt(token), username: userForm.username, password: userForm.password, role: userForm.role, real_name: userForm.real_name, phone: userForm.phone, mail: userForm.mail, description: userForm.description })
        });
        const result = await response.json();
        if (result.code === 200) { showToast('用户创建成功'); setShowUserDialog(false); fetchUsersList(); }
        else showToast(result.message || '操作失败');
      } catch (err) { showToast('网络错误'); }
    } else if (userDialogMode === 'edit') {
      try {
        const body = { user_token: parseInt(token), target_id: editingUserId };
        if (userForm.role) body.role = userForm.role;
        if (userForm.real_name) body.real_name = userForm.real_name;
        if (userForm.phone) body.phone = userForm.phone;
        if (userForm.mail) body.mail = userForm.mail;
        if (userForm.description) body.description = userForm.description;
        if (userForm.status) body.status = userForm.status;
        const response = await fetch('/api/admin/users/update', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const result = await response.json();
        if (result.code === 200) { showToast('用户信息已更新'); setShowUserDialog(false); fetchUsersList(); }
        else showToast(result.message || '更新失败');
      } catch (err) { showToast('网络错误'); }
    } else if (userDialogMode === 'resetPwd') {
      if (!userForm.password || userForm.password.length < 6) {
        showToast('密码至少6个字符');
        return;
      }
      try {
        const response = await fetch('/api/admin/users/reset_password', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_token: parseInt(token), target_id: editingUserId, new_password: userForm.password })
        });
        const result = await response.json();
        if (result.code === 200) { showToast('密码重置成功'); setShowUserDialog(false); }
        else showToast(result.message || '操作失败');
      } catch (err) { showToast('网络错误'); }
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!window.confirm(`确认删除用户 "${userName}" 吗？此操作不可撤销。`)) return;
    const token = localStorage.getItem('dpfs_token');
    if (!token) return;
    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_token: parseInt(token), target_id: userId })
      });
      const result = await response.json();
      if (result.code === 200) { showToast('用户已删除'); fetchUsersList(); }
      else showToast(result.message || '删除失败');
    } catch (err) { showToast('网络错误'); }
  };

  const batchDeleteUsers = async () => {
    const ids = [...selectedUserIds];
    if (ids.length === 0) return;
    const nameMap = {};
    usersList.forEach(u => { nameMap[u.id] = u.name; });
    const names = ids.map(id => nameMap[id] || id).join('、');
    if (!window.confirm(`确认删除以下 ${ids.length} 个用户？\n${names}\n\n此操作不可撤销。`)) return;

    const token = localStorage.getItem('dpfs_token');
    if (!token) return;

    let success = 0, fail = 0;
    for (const id of ids) {
      try {
        const response = await fetch('/api/admin/users/delete', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_token: parseInt(token), target_id: id })
        });
        const result = await response.json();
        if (result.code === 200) success++;
        else fail++;
      } catch { fail++; }
    }
    setSelectedUserIds(new Set());
    if (success > 0) showToast(`成功删除 ${success} 个用户${fail > 0 ? `，${fail} 个失败` : ''}`);
    else showToast('删除失败');
    fetchUsersList();
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
      h: '高风险',
      low: '低风险',
      medium: '中风险',
      high: '高风险'
    };
    const labelMap = {
      risk: '安全风险',
      health: '健康风险',
      comp_ana: '成分分析',
      pot_risk: '潜在风险',
      suggest: '建议',
      risk_level: '综合风险等级',
      patient_risk: '患者特异性风险',
      ingredient_analysis: '原料风险分析',
      interaction_warning: '药物-食物相互作用',
      recommendation: '食用建议',
      general_risk: '一般性风险'
    };
    const order = ['risk_level', 'risk', 'health', 'patient_risk', 'ingredient_analysis', 'interaction_warning', 'comp_ana', 'pot_risk', 'recommendation', 'suggest', 'general_risk'];

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
      if (k === 'risk' || k === 'health' || k === 'risk_level') {
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

    // 判断是否为 epoch 时间（1969-12-31 或 1970-01-01 附近），显示为 null
    const isEpochTime = (v) => {
      if (typeof v !== 'string') return false;
      return /^19(69|70)-12-3[01]|^1970-01-0[01]/.test(v.trim());
    };

    // 安全字符串化：对象/数组用JSON，其他用String()
    const safeStringify = (v) => {
      if (v === null || v === undefined) return '';
      if (isEpochTime(v)) return 'null';
      if (typeof v === 'object') {
        try { return JSON.stringify(v, null, 0); } catch { return String(v); }
      }
      return String(v);
    };

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
                  <span className={`text-xs font-semibold ${keyColor(k)} truncate`}>{safeStringify(v)}</span>
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
                        <span className="text-[11px] text-emerald-400/80">{safeStringify(v)}</span>
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
    if (!token) return showToast("请先登录");
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

      if (checkApiSession(result)) return;

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
    if (!token) return showToast("请先登录");

    // 前端校验必填字段
    const requiredFields = [
      { key: 'trade_schema', label: '扫描模式' },
      { key: 'trade_product_name', label: '商品名称' },
      { key: 'buyer', label: '买方名称' },
      { key: 'buyer_addr', label: '买方地址' },
      { key: 'buyer_phone', label: '买方电话' },
      { key: 'seller', label: '卖方名称' },
      { key: 'seller_addr', label: '卖方地址' },
      { key: 'seller_phone', label: '卖方电话' },
      { key: 'logistics_info', label: '物流信息' },
      { key: 'other_info', label: '其他信息' },
      { key: 'trade_price', label: '交易价格' },
    ];
    for (const f of requiredFields) {
      if (!String(tradeForm[f.key] || '').trim()) {
        showToast(`请填写${f.label}`);
        return;
      }
    }

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
    if (!token) return showToast("会话已过期，请重新登录");
    setIsLoading(true);
    try {
      const res = await fetch('/api/list_risk_pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_token: parseInt(token), begin: beginIndex, limit: 20 })
      });
      const result = await res.json();
      if (checkApiSession(result)) return;
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
        showToast(result?.message || "查询失败");
      }
    } catch (e) {
      showToast(e?.message || "查询失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchSystemData = async (beginIndex = 0, searchName = undefined) => {
    const token = localStorage.getItem('dpfs_token');
    if (!token) return showToast("会话已过期，请重新登录");
    const name = searchName !== undefined ? searchName : systemSearchName;
    setIsLoading(true);
    try {
      const checkPayload = { user_token: parseInt(token), begin: 0, limit: 1 };
      if (name) checkPayload.name = name;
      const checkRes = await fetch('/api/list_tracable_pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkPayload)
      });
      const checkResult = await checkRes.json();
      if (checkApiSession(checkResult)) return;
      if (checkResult.code === 200) {
        setSystemTotal(checkResult.total);
        const fetchPayload = { user_token: parseInt(token), begin: beginIndex, limit: 20 };
        if (name) fetchPayload.name = name;
        const fetchRes = await fetch('/api/list_tracable_pro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fetchPayload)
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
    if (!token) return showToast("会话已过期，请重新登录");

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
    if (!loginForm.username || !loginForm.password) return showToast("请输入账号和密码");
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
      } else if (result.code === 403) {
        showToast("账号或密码错误，请重新输入");
      } else {
        showToast(result.message || "登录失败，请稍后重试");
      }
    } catch (error) {
      showToast("无法连接服务器，请检查网络");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerForm.username || !registerForm.password) return showToast("请完整输入用户名和密码");
    if (registerForm.password.length < 6) return showToast("密码长度不能少于6位");
    if (registerForm.password !== registerForm.confirmPassword) return showToast("两次输入的密码不一致");
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
        showToast("注册成功！请使用新账号登录");
        setShowRegister(false);
        setLoginForm({ username: registerForm.username, password: '' });
        setRegisterForm({ username: '', password: '', confirmPassword: '', role: 'consumer' });
      } else {
        showToast(result.message || "注册失败");
      }
    } catch (error) {
      showToast("连接失败，请检查网络");
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
        {/* 登录页提示 */}
        {toast.show && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 bg-red-600 text-white rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300 font-bold border border-red-400/30 flex items-center gap-3">
            <ShieldAlert size={20} className="shrink-0" />
            {toast.message}
          </div>
        )}
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
                      <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} placeholder="输入管理账号" className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-900/50 border border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-lg" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
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
                      <input type="password" value={registerForm.confirmPassword} onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })} placeholder="确认密码" className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-lg text-white" onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
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
        onConfirm={async () => {
          const token = localStorage.getItem('dpfs_token');
          if (token) {
            try {
              await fetch('/api/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_token: parseInt(token) })
              });
            } catch (e) { /* ignore logout API error */ }
          }
          localStorage.removeItem('dpfs_token');
          localStorage.removeItem('dpfs_role');
          setIsLoggedIn(false);
          setUserInfo(null);
          setShowLogoutModal(false);
          setLoginForm({ username: '', password: '' });
        }}
      />

      <SessionExpiredModal
        isOpen={showSessionModal}
        onConfirm={() => {
          setShowSessionModal(false);
          setIsLoggedIn(false);
          setUserInfo(null);
          setLoginForm({ username: '', password: '' });
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
            { key: 'home', icon: Home, label: '系统主页', desc: '概览与快捷入口' },
            { key: 'dashboard', icon: LayoutDashboard, label: '信息录入', desc: '产品风险评估' },
            { key: 'trace', icon: Search, label: '商品溯源', desc: '溯源链路查询' },
            { key: 'make_trade', icon: Plus, label: '创建交易', desc: '交易信息登记' },
            { key: 'activity', icon: Activity, label: '数据查询', desc: '系统溯源数据查询' },
            { key: 'risk_query', icon: ShieldCheck, label: '风险查询', desc: '安全风险评估' },
            { key: 'monitor', icon: Monitor, label: '系统监控', desc: '系统状态实时监控' },
            { key: 'users', icon: Users, label: '用户管理', desc: '系统用户操作管理' },
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
        <div className={`h-full overflow-y-auto custom-scrollbar transition-all duration-500 ${(activeTab === 'monitor' || activeTab === 'home') ? 'p-4 flex-1' : (activeTab === 'activity' || activeTab === 'make_trade' || activeTab === 'risk_query' || activeTab === 'profile' || activeTab === 'users') ? 'p-12 flex-1 bg-slate-50/50' : (activeTab === 'trace' ? 'p-12 flex-[0.9]' : 'p-12 flex-[1.3]')}`}>
          <div className={`${(activeTab === 'monitor' || activeTab === 'home') ? 'max-w-full' : (activeTab === 'activity' || activeTab === 'make_trade' || activeTab === 'risk_query' || activeTab === 'profile' || activeTab === 'users') ? 'max-w-6xl' : 'max-w-3xl'} mx-auto`}>

            {activeTab === 'home' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col" style={{gap:'16px'}}>

                {/* ── 欢迎横幅 ── */}
                <div className="relative overflow-hidden rounded-2xl p-8 flex items-center justify-between" style={{background:'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#134e4a 100%)'}}>
                  <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{backgroundImage:'radial-gradient(#10b981 1px, transparent 1px)',backgroundSize:'24px 24px'}}></div>
                  <div className="relative z-10 text-white">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                        <ShieldCheck size={18} className="text-emerald-400" />
                      </div>
                      <span className="text-[11px] font-mono font-bold tracking-[0.3em] text-emerald-400 uppercase">DPFS Platform</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">
                      欢迎回来，{userInfo?.username || localStorage.getItem('dpfs_role') || '用户'}
                    </h2>
                    <p className="text-slate-400 text-sm max-w-xl">
                      基于DPFS的农产品安全风险智能评估系统 — 实时溯源、AI风险评估、全链路数据管理
                    </p>
                  </div>
                  <div className="relative z-10 text-right">
                    <div className="text-[11px] text-emerald-400/60 font-mono uppercase tracking-widest mb-1">当前时间</div>
                    <div className="text-2xl font-black text-white font-mono tracking-tight" style={{fontFamily:'Orbitron,sans-serif'}}>
                      {currentTime.toLocaleTimeString('zh-CN',{hour12:false})}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {currentTime.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'})}
                    </div>
                  </div>
                </div>

                {/* ── KPI 卡片行 ── */}
                <div className="grid grid-cols-4" style={{gap:'16px'}}>
                  {[
                    { label:'溯源产品', value: monitorData?.total_products ?? '-', sub:'Total Products', icon:<Box size={18} className="text-cyan-500" />, accent:'text-cyan-600', bg:'rgba(6,182,212,.06)', border:'rgba(6,182,212,.15)' },
                    { label:'风险产品', value: monitorData?.risk_products ?? '-', sub:'Risk Products', icon:<AlertTriangle size={18} className={(monitorData?.risk_products ?? 0) > 0 ? 'text-rose-500' : 'text-slate-400'} />, accent:(monitorData?.risk_products ?? 0) > 0 ? 'text-rose-600' : 'text-slate-700', bg:(monitorData?.risk_products ?? 0) > 0 ? 'rgba(244,63,94,.06)' : 'rgba(248,250,252,.8)', border:(monitorData?.risk_products ?? 0) > 0 ? 'rgba(244,63,94,.2)' : 'rgba(16,185,129,.1)' },
                    { label:'溯源查询', value: monitorData?.trace_count_per_min ?? '-', sub:'Queries / min', icon:<Search size={18} className="text-emerald-500" />, accent:'text-emerald-600', bg:'rgba(16,185,129,.06)', border:'rgba(16,185,129,.15)' },
                    { label:'在线用户', value: monitorData?.active_users ?? '-', sub:'Active Sessions', icon:<User size={18} className="text-violet-500" />, accent:'text-violet-600', bg:'rgba(139,92,246,.06)', border:'rgba(139,92,246,.15)' },
                  ].map((card,i)=>(
                    <div key={i} className="relative overflow-hidden rounded-xl p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 bg-white border" style={{borderColor:card.border}}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
                        <div className="p-1.5 rounded-lg" style={{background:card.bg}}>{card.icon}</div>
                      </div>
                      <div className="text-4xl font-black leading-none" style={{color:card.accent.replace('text-','').includes('rose')?'#e11d48':card.accent.includes('cyan')?'#0891b2':card.accent.includes('emerald')?'#059669':'#7c3aed'}}>{card.value}</div>
                      <div className="text-[10px] text-slate-300 mt-2 font-mono uppercase tracking-wider">{card.sub}</div>
                    </div>
                  ))}
                </div>

                {/* ── 快捷入口 + 健康推荐 ── */}
                <div style={{display:'flex',gap:'16px'}} className="flex-1 min-h-0">
                  {/* 左：快捷入口 */}
                  <div style={{flex:'1.4'}} className="rounded-xl p-6 bg-white border border-slate-100">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                      <h3 className="text-sm font-black text-slate-800 tracking-wide">快捷操作</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key:'dashboard', icon:LayoutDashboard, label:'信息录入', desc:'产品风险评估', color:'text-emerald-600', bg:'bg-emerald-50', hover:'hover:bg-emerald-500 hover:text-white' },
                        { key:'trace', icon:Search, label:'商品溯源', desc:'溯源链路查询', color:'text-cyan-600', bg:'bg-cyan-50', hover:'hover:bg-cyan-500 hover:text-white' },
                        { key:'make_trade', icon:Plus, label:'创建交易', desc:'交易信息登记', color:'text-blue-600', bg:'bg-blue-50', hover:'hover:bg-blue-500 hover:text-white' },
                        { key:'activity', icon:Activity, label:'数据查询', desc:'系统溯源数据', color:'text-violet-600', bg:'bg-violet-50', hover:'hover:bg-violet-500 hover:text-white' },
                        { key:'risk_query', icon:ShieldCheck, label:'风险查询', desc:'安全风险评估', color:'text-amber-600', bg:'bg-amber-50', hover:'hover:bg-amber-500 hover:text-white' },
                        { key:'monitor', icon:Monitor, label:'系统监控', desc:'实时状态监控', color:'text-rose-600', bg:'bg-rose-50', hover:'hover:bg-rose-500 hover:text-white' },
                      ].filter(item => hasPagePermission(item.key)).map(item => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.key}
                            onClick={() => { setActiveTab(item.key); if (item.key !== 'profile') setProfileView('info'); }}
                            className={`group p-4 rounded-xl border border-slate-100 transition-all text-left ${item.hover}`}
                          >
                            <div className={`p-2 rounded-lg ${item.bg} ${item.color} mb-3 inline-block transition-all group-hover:bg-white/20`}>
                              <Icon size={20} />
                            </div>
                            <div className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors">{item.label}</div>
                            <div className="text-[10px] text-slate-400 group-hover:text-white/70 transition-colors mt-0.5">{item.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 右：AI 智能推荐 */}
                  <div style={{flex:'1'}} className="rounded-xl p-5 bg-white border border-slate-100 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                      <h3 className="text-sm font-black text-slate-800 tracking-wide">🥗 AI 健康推荐</h3>
                      <button
                        onClick={fetchRecommendations}
                        disabled={recommendLoading}
                        className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold hover:text-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={11} className={recommendLoading ? 'animate-spin' : ''} />
                        {recommendLoading ? '生成中...' : '刷新'}
                      </button>
                    </div>

                    {recommendLoading && recommendations.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                        <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                        <span className="text-xs font-bold">AI 正在为您生成个性化推荐...</span>
                      </div>
                    ) : recommendations.length > 0 ? (
                      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar">
                        {recommendations.map((item, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-emerald-50/60 transition-all group">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-emerald-600 text-sm font-black shrink-0 group-hover:scale-110 transition-transform">
                              {['🍎','🥦','🌾','🥛','🐟'][i] || '🍽️'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-black text-slate-800 truncate">{item.name}</span>
                                <span className="text-amber-400 text-[10px] tracking-tight">{'★'.repeat(item.stars || 0)}{'☆'.repeat(5 - (item.stars || 0))}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{item.reason}</p>
                            </div>
                          </div>
                        ))}
                        {recommendTip && (
                          <div className="mt-auto pt-2 border-t border-slate-100">
                            <p className="text-[10px] text-emerald-600 font-medium leading-relaxed flex items-start gap-1.5">
                              <span className="text-sm">💡</span>
                              <span>{recommendTip}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                        <span className="text-3xl">🥗</span>
                        <span className="text-xs font-bold text-slate-500">基于系统已有商品为您推荐</span>
                        <button
                          onClick={fetchRecommendations}
                          disabled={recommendLoading}
                          className="mt-1 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50"
                        >
                          {recommendLoading ? '生成中...' : '立即生成推荐'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

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
                      {[{ label: '扫描模式', key: 'modeName', ph: '标准模式', type: 'text' }, { label: '商品全称', key: 'productName', ph: '输入商品名', type: 'text' }, { label: '批次数量', key: 'quantity', ph: '0', type: 'number' }].map(item => (
                        <div key={item.key}>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-3 ml-1">{item.label}{item.key !== 'modeName' && <span className="text-red-400 ml-0.5">*</span>}</label>
                          <input type={item.type} min={item.type === 'number' ? 1 : undefined} onChange={(e) => handleInputChange(item.key, e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-semibold text-slate-700" placeholder={item.ph} />
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
                        placeholder="输入40位十六进制溯源码"
                      />
                      <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>

                    <label className="block text-xs font-semibold text-slate-500 mb-3">查询选项</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                      {[
                        { key: 'traceDetail', title: '详细交易信息', desc: '包含交易流转记录', icon: Activity },
                        { key: 'ingreDetail', title: '详细配料信息', desc: '配料溯源树与占比', icon: ListChecks },
                        { key: 'aiRisk', title: 'AI食品风险评估', desc: '基于患者信息的个性化分析', icon: ShieldCheck }
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
                        { label: '发生交易的溯源组', key: 'trade_schema', ph: '输入溯源组', required: true },
                        { label: '发生交易的产品名称', key: 'trade_product_name', ph: '输入产品名称', required: true },
                        { label: '发生交易的产品起始ID', key: 'trade_product_start_id', ph: '输入起始ID', required: false },
                        { label: '发生交易的产品数量', key: 'trade_product_number', ph: '输入数量', required: false },
                        { label: '发生金额', key: 'trade_price', ph: '输入金额', required: true },
                        { label: '物流信息', key: 'logistics_info', ph: '输入物流信息', required: true },
                        { label: '其它信息', key: 'other_info', ph: '输入其它信息', required: true }
                      ].map((f) => (
                        <div key={f.key}>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-3 ml-1">{f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}</label>
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
                        { label: '买方名称', key: 'buyer', ph: '输入买方名称', required: true },
                        { label: '买方地址', key: 'buyer_addr', ph: '输入买方地址', required: true },
                        { label: '买方联系方式', key: 'buyer_phone', ph: '输入买方联系方式', required: true },
                        { label: '卖方名称', key: 'seller', ph: '输入卖方名称', required: true },
                        { label: '卖方地址', key: 'seller_addr', ph: '输入卖方地址', required: true },
                        { label: '卖方联系方式', key: 'seller_phone', ph: '输入卖方联系方式', required: true }
                      ].map((f) => (
                        <div key={f.key}>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-3 ml-1">{f.label}<span className="text-red-400 ml-0.5">*</span></label>
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
                  {riskProData.length === 0 && !isLoading && <div className="py-20 text-center text-slate-300 italic font-medium">暂无高风险商品数据</div>}
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
                <header className="mb-6">
                  <div className="flex items-center justify-between mb-4">
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
                      onClick={() => { setSystemSearchName(''); handleFetchSystemData(0, ''); }}
                      disabled={isLoading}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                      查询全部
                    </button>
                  </div>
                  {/* 搜索栏 */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input
                        type="text"
                        value={systemSearchName}
                        onChange={(e) => setSystemSearchName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleFetchSystemData(0); }}
                        placeholder="输入产品名称搜索（前缀匹配）"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200/60 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300"
                      />
                    </div>
                    <button
                      onClick={() => handleFetchSystemData(0)}
                      disabled={isLoading}
                      className="px-5 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-600 transition-all disabled:opacity-50"
                    >
                      <Search size={16} />
                      搜索
                    </button>
                    {systemSearchName && (
                      <button
                        onClick={() => { setSystemSearchName(''); handleFetchSystemData(0, ''); }}
                        className="px-4 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                      >
                        清除
                      </button>
                    )}
                  </div>
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

                {/* ── Middle: Charts (2/3) + Resources & Stats (1/3) ── */}
                <div style={{display:'flex', gap:'10px'}} className="flex-1 min-h-0">
                  {/* Left: 两张图表并排，占 2/3 */}
                  <div style={{flex:'2', display:'flex', flexDirection:'column', gap:'10px', minHeight:0}}>
                    <div className="grid grid-cols-2 flex-1 min-h-0" style={{gap:'10px'}}>
                      {/* 溯源查询折线图 */}
                      <div className="rounded-xl p-3 flex flex-col min-h-0" style={{background:'linear-gradient(135deg,rgba(255,255,255,.97),rgba(248,250,252,.95))',border:'1px solid rgba(16,185,129,.1)'}}>
                        <div className="flex items-center justify-between mb-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <Activity size={14} className="text-emerald-500" />
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">溯源查询趋势</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            <span className="text-[10px] text-rose-500 font-bold">LIVE 5s</span>
                            <span className="text-[10px] text-slate-300 font-mono ml-2">5 min</span>
                          </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                          <TraceLineChart data={traceHistory} />
                        </div>
                      </div>

                      {/* 交易统计折线图 */}
                      <div className="rounded-xl p-3 flex flex-col min-h-0" style={{background:'linear-gradient(135deg,rgba(255,255,255,.97),rgba(248,250,252,.95))',border:'1px solid rgba(16,185,129,.1)'}}>
                        <div className="flex items-center justify-between mb-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <Plus size={14} className="text-blue-500" />
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">交易统计趋势</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            <span className="text-[10px] text-rose-500 font-bold">LIVE 5s</span>
                            <span className="text-[10px] text-slate-300 font-mono ml-2">5 min</span>
                          </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                          <TraceLineChart data={tradeHistory} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: 系统资源 + 响应时间 + 在线用户，窄栏 */}
                  <div style={{flex:'0.85', display:'flex', flexDirection:'column', gap:'8px', minHeight:0}}>
                    {/* 系统资源 */}
                    <div className="rounded-xl p-4 flex-1 flex flex-col min-h-0" style={{background:'linear-gradient(135deg,rgba(255,255,255,.97),rgba(248,250,252,.95))',border:'1px solid rgba(16,185,129,.1)'}}>
                      <div className="flex items-center gap-2 mb-3 shrink-0">
                        <Cpu size={14} className="text-blue-500" />
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">系统资源</span>
                      </div>
                      <div className="flex-1 flex flex-col justify-center gap-4">
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

                    {/* 响应时间 */}
                    <div className="rounded-xl px-3 py-2.5 shrink-0" style={{background:'linear-gradient(135deg,rgba(255,255,255,.97),rgba(248,250,252,.95))',border:'1px solid rgba(16,185,129,.1)'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-violet-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">响应时间</span>
                        </div>
                        <span className="text-lg font-black text-slate-800" style={{fontFamily:'Orbitron,sans-serif'}}>{monitorData?.response_time_ms?.toFixed(1) ?? '-'}<span className="text-[10px] text-slate-400 font-mono ml-0.5">ms</span></span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{background:'rgba(16,185,129,.06)'}}>
                        <div className={`h-full rounded-full transition-all duration-500 ${(monitorData?.response_time_ms ?? 0) < 100 ? 'bg-emerald-500' : (monitorData?.response_time_ms ?? 0) < 500 ? 'bg-amber-400' : 'bg-red-500'}`} style={{width:`${Math.min((monitorData?.response_time_ms ?? 0) / 10, 100)}%`}}></div>
                      </div>
                    </div>

                    {/* 在线用户 */}
                    <div className="rounded-xl px-3 py-2.5 shrink-0" style={{background:'linear-gradient(135deg,rgba(255,255,255,.97),rgba(248,250,252,.95))',border:'1px solid rgba(16,185,129,.1)'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User size={12} className="text-cyan-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">在线用户</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{boxShadow:'0 0 6px rgba(16,185,129,.5)'}}></span>
                          <span className="text-lg font-black text-slate-800" style={{fontFamily:'Orbitron,sans-serif'}}>{monitorData?.active_users ?? '-'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">sessions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Bottom: 系统日志 (全宽) ── */}
                <div className="rounded-xl p-4 flex flex-col min-h-0" style={{background:'linear-gradient(135deg,rgba(255,255,255,.97),rgba(248,250,252,.95))',border:'1px solid rgba(16,185,129,.1)', flex:'0 0 220px'}}>
                    <div className="flex items-center gap-2 mb-2 shrink-0">
                      <FileText size={13} className="text-violet-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">系统日志</span>
                      <span className="ml-auto text-[9px] text-slate-300 font-mono">{logData.length} entries</span>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-thin" style={{maxHeight:'280px'}}>
                      {logData.length === 0 ? (
                        <div className="text-[10px] text-slate-300 font-mono text-center py-4">No log entries</div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {logData.slice().reverse().map((entry, i) => {
                            const isError = entry.level === 'ERROR' || entry.level === 'FATAL';
                            const isWarn = entry.level === 'NOTIC';
                            const accentColor = isError ? '#ef4444' : isWarn ? '#f59e0b' : '#64748b';
                            const bgColor = isError ? 'rgba(239,68,68,.06)' : isWarn ? 'rgba(245,158,11,.05)' : 'transparent';
                            // Some log entries contain literal \n sequences from concatenated log lines;
                            // split them into separate visual lines for readability
                            const msgLines = (entry.msg || '').split(/\\n|\n/).filter(l => l.trim());
                            return (
                              <div key={i} className="flex items-start gap-2 px-2 py-1 rounded text-[10px] font-mono hover:bg-slate-50 transition-colors" style={{background: bgColor}}>
                                <span className="text-slate-300 shrink-0 w-[85px] pt-[1px]">{entry.time?.slice(11,19) || ''}</span>
                                <span className="shrink-0 mt-[1px] w-[44px] text-center font-bold rounded px-1" style={{color: accentColor, background: `${accentColor}15`, fontSize:'9px'}}>{entry.level}</span>
                                <span className="text-slate-600 break-all leading-relaxed" style={{lineHeight:'1.4'}}>
                                  {msgLines.map((line, li) => (
                                    <span key={li} className="block">{line}</span>
                                  ))}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                <header className="mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                        <Users size={20} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">用户管理</h2>
                        <p className="text-xs text-slate-400 mt-0.5">创建、编辑和管理系统所有用户</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedUserIds.size > 0 && (
                        <button onClick={batchDeleteUsers} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-200">
                          <Trash2 size={14} />
                          删除选中 ({selectedUserIds.size})
                        </button>
                      )}
                      <button onClick={fetchUsersList} className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-600 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-all">
                        <RefreshCw size={14} className={usersLoading ? 'animate-spin' : ''} />
                        刷新
                      </button>
                      <button onClick={openCreateDialog} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                        <UserPlus size={14} />
                        创建用户
                      </button>
                    </div>
                  </div>
                </header>

                {/* 搜索栏 */}
                <div className="mb-6">
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="搜索用户名、真实姓名、电话、邮箱..."
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                    />
                    {userSearch && (
                      <button onClick={() => setUserSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 用户列表表格 */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50/80 text-left">
                          <th className="px-3 py-3 w-10">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              checked={(() => {
                                const q = userSearch.toLowerCase().trim();
                                const filtered = q ? usersList.filter(u =>
                                  (u.name || '').toLowerCase().includes(q) ||
                                  (u.real_name || '').toLowerCase().includes(q) ||
                                  (u.phone || '').toLowerCase().includes(q) ||
                                  (u.mail || '').toLowerCase().includes(q)
                                ) : usersList;
                                return filtered.length > 0 && filtered.every(u => selectedUserIds.has(u.id));
                              })()}
                              onChange={(e) => {
                                const q = userSearch.toLowerCase().trim();
                                const filtered = q ? usersList.filter(u =>
                                  (u.name || '').toLowerCase().includes(q) ||
                                  (u.real_name || '').toLowerCase().includes(q) ||
                                  (u.phone || '').toLowerCase().includes(q) ||
                                  (u.mail || '').toLowerCase().includes(q)
                                ) : usersList;
                                if (e.target.checked) {
                                  setSelectedUserIds(prev => new Set([...prev, ...filtered.map(u => u.id)]));
                                } else {
                                  setSelectedUserIds(prev => {
                                    const next = new Set(prev);
                                    filtered.forEach(u => next.delete(u.id));
                                    return next;
                                  });
                                }
                              }}
                            />
                          </th>
                          <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ID</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">用户名</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">角色</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">真实姓名</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">电话</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">邮箱</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">状态</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">创建时间</th>
                          <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.length === 0 ? (
                          <tr>
                            <td colSpan="10" className="px-5 py-12 text-center text-slate-300 text-sm">
                              {usersLoading ? '加载中...' : '暂无用户数据'}
                            </td>
                          </tr>
                        ) : (
                          (() => {
                            const q = userSearch.toLowerCase().trim();
                            const filtered = q ? usersList.filter(u =>
                              (u.name || '').toLowerCase().includes(q) ||
                              (u.real_name || '').toLowerCase().includes(q) ||
                              (u.phone || '').toLowerCase().includes(q) ||
                              (u.mail || '').toLowerCase().includes(q)
                            ) : usersList;
                            if (q && filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan="10" className="px-5 py-12 text-center text-slate-300 text-sm">
                                    无匹配用户 "{q}"
                                  </td>
                                </tr>
                              );
                            }
                            return filtered.map((user) => {
                            const roleLabels = { admin: '超级管理员', supervisor: '审核员', manufacturer: '生产商', consumer: '消费者' };
                            const roleColors = { admin: 'bg-red-50 text-red-600 border-red-100', supervisor: 'bg-blue-50 text-blue-600 border-blue-100', manufacturer: 'bg-emerald-50 text-emerald-600 border-emerald-100', consumer: 'bg-slate-50 text-slate-500 border-slate-100' };
                            const statusColors = { active: 'bg-emerald-50 text-emerald-600', disabled: 'bg-amber-50 text-amber-600', locked: 'bg-red-50 text-red-600' };
                            const statusLabels = { active: '正常', disabled: '禁用', locked: '锁定' };
                            return (
                              <tr key={user.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="px-3 py-3">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    checked={selectedUserIds.has(user.id)}
                                    onChange={(e) => {
                                      setSelectedUserIds(prev => {
                                        const next = new Set(prev);
                                        if (e.target.checked) next.add(user.id);
                                        else next.delete(user.id);
                                        return next;
                                      });
                                    }}
                                  />
                                </td>
                                <td className="px-5 py-3 text-sm text-slate-500 font-mono">{user.id}</td>
                                <td className="px-5 py-3 text-sm font-bold text-slate-700">{user.name}</td>
                                <td className="px-5 py-3">
                                  <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${roleColors[user.role] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                    {roleLabels[user.role] || user.role}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-sm text-slate-600">{user.real_name || '-'}</td>
                                <td className="px-5 py-3 text-sm text-slate-500 font-mono">{user.phone || '-'}</td>
                                <td className="px-5 py-3 text-sm text-slate-500">{user.mail || '-'}</td>
                                <td className="px-5 py-3">
                                  <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${statusColors[user.status] || 'bg-slate-50 text-slate-500'}`}>
                                    {statusLabels[user.status] || user.status}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-xs text-slate-400 font-mono">{user.created_at ? user.created_at.slice(0, 10) : '-'}</td>
                                <td className="px-5 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button onClick={() => openEditDialog(user)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-1">
                                      <Pencil size={12} />编辑
                                    </button>
                                    <button onClick={() => openResetPwdDialog(user)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-all flex items-center gap-1">
                                      <Lock size={12} />密码
                                    </button>
                                    <button onClick={() => deleteUser(user.id, user.name)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-1">
                                      <Trash2 size={12} />删除
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 用户管理弹窗 */}
            {showUserDialog && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300 p-4">
                <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 transform animate-in zoom-in-95">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${userDialogMode === 'create' ? 'bg-indigo-50 text-indigo-600' : userDialogMode === 'edit' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                        {userDialogMode === 'create' ? <UserPlus size={22} /> : userDialogMode === 'edit' ? <Pencil size={22} /> : <Lock size={22} />}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800">
                          {userDialogMode === 'create' ? '创建用户' : userDialogMode === 'edit' ? '编辑用户' : '重置密码'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {userDialogMode === 'create' ? '管理员可创建任意角色的用户' : userDialogMode === 'edit' ? '修改用户角色、状态和基本信息' : '为用户设置新密码'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setShowUserDialog(false)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {userDialogMode === 'create' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">用户名 *</label>
                          <input type="text" value={userForm.username} onChange={e => handleUserFormChange('username', e.target.value)} placeholder="请输入用户名" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">密码 *</label>
                          <input type="password" value={userForm.password} onChange={e => handleUserFormChange('password', e.target.value)} placeholder="至少6个字符" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">角色 *</label>
                          <select value={userForm.role} onChange={e => handleUserFormChange('role', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all">
                            <option value="admin">超级管理员 (admin)</option>
                            <option value="supervisor">审核员 (supervisor)</option>
                            <option value="manufacturer">生产商 (manufacturer)</option>
                            <option value="consumer">消费者 (consumer)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">真实姓名</label>
                          <input type="text" value={userForm.real_name} onChange={e => handleUserFormChange('real_name', e.target.value)} placeholder="选填" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-indigo-400 transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">电话</label>
                          <input type="text" value={userForm.phone} onChange={e => handleUserFormChange('phone', e.target.value)} placeholder="选填" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-indigo-400 transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">邮箱</label>
                          <input type="text" value={userForm.mail} onChange={e => handleUserFormChange('mail', e.target.value)} placeholder="选填" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-indigo-400 transition-all" />
                        </div>
                      </>
                    )}

                    {userDialogMode === 'edit' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">角色</label>
                          <select value={userForm.role} onChange={e => handleUserFormChange('role', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all">
                            <option value="">不变更</option>
                            <option value="admin">超级管理员</option>
                            <option value="supervisor">审核员</option>
                            <option value="manufacturer">生产商</option>
                            <option value="consumer">消费者</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">账户状态</label>
                          <select value={userForm.status} onChange={e => handleUserFormChange('status', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all">
                            <option value="active">正常</option>
                            <option value="disabled">禁用</option>
                            <option value="locked">锁定</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">真实姓名</label>
                          <input type="text" value={userForm.real_name} onChange={e => handleUserFormChange('real_name', e.target.value)} placeholder="选填" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-indigo-400 transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">电话</label>
                          <input type="text" value={userForm.phone} onChange={e => handleUserFormChange('phone', e.target.value)} placeholder="选填" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-indigo-400 transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">邮箱</label>
                          <input type="text" value={userForm.mail} onChange={e => handleUserFormChange('mail', e.target.value)} placeholder="选填" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-indigo-400 transition-all" />
                        </div>
                      </>
                    )}

                    {userDialogMode === 'resetPwd' && (
                      <>
                        <div className="px-4 py-3 bg-slate-50 rounded-xl">
                          <span className="text-xs text-slate-400">用户：</span>
                          <span className="text-sm font-bold text-slate-700 ml-1">{userForm.username}</span>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">新密码 *</label>
                          <input type="password" value={userForm.password} onChange={e => handleUserFormChange('password', e.target.value)} placeholder="至少6个字符" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 placeholder-slate-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50 transition-all" />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button onClick={() => setShowUserDialog(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 font-bold text-slate-500 hover:bg-slate-200 transition-all">取消</button>
                    <button onClick={submitUserForm} className={`flex-1 py-4 rounded-2xl font-bold text-white shadow-xl transition-all ${userDialogMode === 'create' ? 'bg-indigo-600 hover:bg-indigo-700' : userDialogMode === 'edit' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                      {userDialogMode === 'create' ? '创建' : userDialogMode === 'edit' ? '保存修改' : '重置密码'}
                    </button>
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

      {/* AI 智能助手聊天面板 */}
      {isLoggedIn && <ChatPanel />}
    </div>
  );
}
