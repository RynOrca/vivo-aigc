import React from 'react';

// ==========================================
// 公共 SVG 图标组件 (可根据项目单独抽离为独立文件)
// ==========================================
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const DemoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const ActivityIcon = ({ stroke = "#3f7b73" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);

const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#db7688" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

// ==========================================
// 页面 1: 学习进度看板 (Learning Progress)
// ==========================================
const ScreenOne = () => {
  // [DATA BINDING] 模拟从后端获取的数据，接入项目时请替换为 props 或 state
  const userName = "Elizabeth";
  const currentDate = "Mon, 23 July";
  const userLevel = 22;
  const currentActivityStatus = "Active";
  const lessonsCount = 44;
  
  // 播放器状态
  const currentTimeSec = 42;
  const totalTimeSec = 152; // 02:32
  
  // 计算进度百分比 (0 到 100)
  const progressRatio = currentTimeSec / totalTimeSec; 
  const percentage = Math.min(Math.max(progressRatio * 100, 0), 100);

  // 利用三角函数精确计算进度圆点的位置
  // 圆心坐标: cx=140, cy=120, 半径: r=110
  // SVG 中的半圆是从 180 度 (左侧) 到 0 度 (右侧)
  const angleInRadians = Math.PI - (progressRatio * Math.PI);
  const dotX = 140 + 110 * Math.cos(angleInRadians);
  const dotY = 120 - 110 * Math.sin(angleInRadians);

  return (
    <div className="w-[375px] h-[812px] bg-[#f7f8ec] rounded-[40px] overflow-hidden relative shadow-2xl shrink-0">
      
      {/* 头部区域 */}
      <div className="bg-[#db7688] h-[190px] px-6 py-6 rounded-b-[40px] relative z-10 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl text-white font-bold mb-1 flex items-center gap-2">
              Hi, {userName} <span>👋🏻</span>
            </h1>
            <p className="text-sm text-white/80">{currentDate}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* [EVENT BINDING] 搜索按钮点击 */}
            <button className="w-10 h-10 bg-white/30 rounded-full flex justify-center items-center text-white hover:bg-white/40 transition">
              <SearchIcon />
            </button>
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
              alt="User" 
              className="w-12 h-12 rounded-full object-cover border-2 border-[#e8b65e]" 
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-1">
          {/* [EVENT BINDING] 申请 Demo 按钮 */}
          <button className="bg-[#1a1a1a] text-white px-5 py-3 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-black transition">
            <DemoIcon /> Request Demo
          </button>
          <a href="#" className="text-white text-[13px] flex flex-col items-center gap-1 hover:opacity-80">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            Learn More
          </a>
        </div>
      </div>

      {/* 数据概览区域 */}
      <div className="px-6 py-6 pb-2 relative z-10 bg-[#f7f8ec]">
        <p className="text-sm text-[#666] font-semibold mb-2">Level {userLevel}</p>
        <h2 className="text-[32px] font-extrabold text-[#1a1a1a] leading-tight mb-5 tracking-tight">
          Learning progress
        </h2>
        
        <div className="flex gap-6 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#e8ede3] rounded-full flex justify-center items-center">
              <ActivityIcon />
            </div>
            <div>
              <p className="text-xs text-[#666] mb-0.5">Current activity</p>
              <h4 className="text-base font-bold text-[#3f7b73]">{currentActivityStatus}</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f2e3e1] rounded-full flex justify-center items-center">
              <BookIcon />
            </div>
            <div>
              <p className="text-xs text-[#666] mb-0.5">Lessons</p>
              <h4 className="text-base font-bold text-[#db7688]">#{lessonsCount}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* 底部媒体控制 & 进度条区域 */}
      <div className="absolute bottom-0 left-0 w-full h-[470px] bg-[#e8b65e] rounded-t-[100px] overflow-hidden">
        
        <div className="absolute bottom-0 left-0 w-full h-[300px] bg-[#558d88] rounded-t-[80px] flex flex-col items-center pt-10">
          
          {/* 圆弧进度条容器 */}
          <div className="w-[280px] h-[140px] relative">
            <svg viewBox="0 0 280 140" className="overflow-visible w-full h-full">
              {/* 1. 灰色背景轨道 - 共用同一个 path 指令确保绝对对齐 */}
              <path 
                d="M 30 120 A 110 110 0 0 1 250 120" 
                fill="none" 
                stroke="rgba(255,255,255,0.2)" 
                strokeWidth="10" 
                strokeLinecap="round" 
              />
              
              {/* 2. 白色进度轨道 - 使用 pathLength="100" 直接进行百分比映射，杜绝断层 */}
              <path 
                d="M 30 120 A 110 110 0 0 1 250 120" 
                fill="none" 
                stroke="#fff" 
                strokeWidth="10" 
                strokeLinecap="round" 
                pathLength="100" 
                strokeDasharray={`${percentage} 100`} 
              />
              
              {/* 3. 进度指示圆点 - 位置通过顶部的三角函数精确绑定 */}
              <circle 
                cx={dotX} 
                cy={dotY} 
                r="10" 
                fill="#1a1a1a" 
                stroke="#e8b65e" 
                strokeWidth="4" 
                className="transition-all duration-300 ease-out"
              />
            </svg>
            
            {/* 时间文本显示 */}
            <div className="absolute top-[70px] w-full text-center text-white text-lg font-semibold tracking-wide">
              00:42/02:32
            </div>
          </div>
          
          {/* 播放器控制按键 */}
          <div className="flex items-center gap-10 mt-2">
            {/* [EVENT BINDING] 声音控制 */}
            <button className="hover:opacity-80">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="#fff" strokeWidth="2" fill="none"/></svg>
            </button>
            
            {/* [EVENT BINDING] 播放/暂停控制 */}
            <button className="w-20 h-20 bg-[#6a9f99] rounded-full flex justify-center items-center border-[8px] border-white/20 hover:scale-105 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="1a1a1a"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
            
            {/* [EVENT BINDING] 播放列表菜单 */}
            <button className="hover:opacity-80">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/><path d="M18 15v6l3-3"/></svg>
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 页面 2: 学习计划与图表 (Learning Plan)
// ==========================================
const ScreenTwo = () => {
  // [DATA BINDING] 卡片与图表数据绑定
  const userName = "Elizabeth";
  const currentDate = "Mon, 23 July";
  
  const stats = {
    total: 44,
    completed: 12,
    upcoming: 34
  };
  
  const averageProgress = 78;
  
  // 图表高亮控制点 (260 对应图表 SVG ViewBox 中的 August 位置)
  // 如果需要动态化折线图，需将 d="..." 内的曲线转化为通过数据点生成的贝塞尔曲线
  const highlightX = 260; 

  return (
    <div className="w-[375px] h-[812px] bg-[#f7f8ec] rounded-[40px] flex flex-col p-6 shadow-2xl shrink-0 overflow-hidden relative">
      
      {/* 头部区域 */}
      <div className="flex justify-between items-start mb-8 mt-2">
        <div>
          <h1 className="text-2xl text-[#1a1a1a] font-bold mb-1 flex items-center gap-2">
            Hi, {userName} <span>👋🏻</span>
          </h1>
          <p className="text-sm text-[#888]">{currentDate}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* [EVENT BINDING] 搜索功能 */}
          <button className="w-10 h-10 bg-[#e5e6da] rounded-full flex justify-center items-center text-[#1a1a1a] hover:bg-[#d5d6ca] transition">
            <SearchIcon />
          </button>
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
            alt="User" 
            className="w-12 h-12 rounded-full object-cover" 
          />
        </div>
      </div>

      <h2 className="text-[32px] font-extrabold text-[#1a1a1a] mb-6 tracking-tight">
        Learning plan
      </h2>

      {/* 数据卡片模块 */}
      <div className="flex justify-between mb-10">
        <div className="flex flex-col items-center w-[30%] relative">
          <div className="absolute top-0 w-full h-[110px] bg-[#e8ede3] rounded-[40px] z-0"></div>
          <div className="relative z-10 flex flex-col items-center pt-3">
            <div className="w-9 h-9 rounded-full bg-white border border-[#1a1a1a] flex justify-center items-center mb-3">
              <ActivityIcon />
            </div>
            <div className="text-[28px] font-extrabold text-[#1a1a1a] mb-5">{stats.total}</div>
            <div className="text-xs text-[#666] font-medium">Total</div>
          </div>
        </div>

        <div className="flex flex-col items-center w-[30%] relative">
          <div className="absolute top-0 w-full h-[110px] bg-[#f2e3e1] rounded-[40px] z-0"></div>
          <div className="relative z-10 flex flex-col items-center pt-3">
            <div className="w-9 h-9 rounded-full bg-[#eab45c] flex justify-center items-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
            </div>
            <div className="text-[28px] font-extrabold text-[#1a1a1a] mb-5">{stats.completed}</div>
            <div className="text-xs text-[#666] font-medium">Completed</div>
          </div>
        </div>

        <div className="flex flex-col items-center w-[30%] relative">
          <div className="absolute top-0 w-full h-[110px] border-[1.5px] border-dashed border-[#ccc] rounded-[40px] z-0"></div>
          <div className="relative z-10 flex flex-col items-center pt-3">
            <div className="w-9 h-9 rounded-full bg-white border border-[#1a1a1a] flex justify-center items-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </div>
            <div className="text-[28px] font-extrabold text-[#1a1a1a] mb-5">{stats.upcoming}</div>
            <div className="text-xs text-[#666] font-medium">Upcoming</div>
          </div>
        </div>
      </div>

      {/* 总体进度展示 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-[64px] font-extrabold text-[#1a1a1a] leading-none tracking-tighter">{averageProgress}%</h2>
          <p className="text-sm text-[#1a1a1a] font-bold">Average progress</p>
        </div>
        <div className="text-center">
          {/* [EVENT BINDING] 了解更多详情跳转 */}
          <button className="w-10 h-10 rounded-full border border-[#ccc] flex justify-center items-center mx-auto mb-2 hover:bg-gray-100 transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
          </button>
          <p className="text-[13px] font-bold text-[#1a1a1a] cursor-pointer">Learn More</p>
        </div>
      </div>

      {/* 底部折线图区域 */}
      <div className="flex-grow bg-gradient-to-b from-[#f3d7dc] to-[#f7f8ec] -mx-6 -mb-6 px-6 pt-6 relative border-t-2 border-[#ebbec6]">
        <div className="flex justify-between text-sm font-bold text-[#1a1a1a] mb-5">
          <span>10 mon</span>
          <span>2024</span>
        </div>
        
        <div className="relative h-[160px] w-full">
          
          {/* 图表中心指示线 */}
          <div style={{ left: `${(highlightX / 400) * 100}%` }} className="absolute bottom-[-16px] -translate-x-1/2 w-0.5 h-[160px] border-l border-dashed border-[#db7688]/70 z-10"></div>
          
          {/* 进度百分比 Tooltip */}
          <div style={{ left: `${(highlightX / 400) * 100}%` }} className="absolute top-2 -translate-x-1/2 bg-[#1a1a1a] text-white px-4 py-2 rounded-full text-base font-bold z-20 shadow-lg">
            {averageProgress}%
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#1a1a1a]"></div>
          </div>
          
          {/* 数据点气泡 (静态展示) */}
          <div className="absolute top-[60px] left-[20%] bg-white/60 rounded-full px-3 py-1 text-xs font-bold text-[#666] z-10">+12</div>
          <div className="absolute bottom-[10px] left-[65%] bg-white/60 rounded-full px-3 py-1 text-xs font-bold text-[#666] z-10">-22</div>
          <div className="absolute top-[40px] right-[5%] bg-white/60 rounded-full px-3 py-1 text-xs font-bold text-[#666] z-10">+43</div>
          
          <svg viewBox="0 0 400 160" className="w-full h-full" preserveAspectRatio="none">
            {/* 网格参考线 */}
            <line x1="100" y1="0" x2="100" y2="160" stroke="#ccc" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.5" />
            <line x1="200" y1="0" x2="200" y2="160" stroke="#ccc" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.5" />
            <line x1="260" y1="0" x2="260" y2="160" stroke="#db7688" strokeWidth="1" strokeDasharray="4 4" />
            
            {/* 走势折线 */}
            <path 
              d="M 0 150 C 40 150, 60 110, 100 110 C 140 110, 160 140, 200 100 C 230 70, 250 20, 270 20 C 300 20, 310 140, 350 140 C 370 140, 390 110, 400 110" 
              fill="none" 
              stroke="#db7688" 
              strokeWidth="5" 
              strokeLinecap="round" 
            />
            {/* 高亮节点 */}
            <circle cx="260" cy="30" r="5" fill="#fff" stroke="#1a1a1a" strokeWidth="3" />
          </svg>
        </div>
        
        {/* X轴坐标 */}
        <div className="flex justify-between px-2 mt-3 text-xs text-[#666] font-medium">
          <span>May</span>
          <span>Jun</span>
          <span>July</span>
          <span className="text-[#1a1a1a] font-bold border border-[#1a1a1a] px-3 py-0.5 rounded-full">August</span>
          <span>Septembe...</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 根组件渲染
// ==========================================
export default function App() {
  return (
    <div className="flex justify-center gap-10 p-10 bg-[#1e1e1e] min-h-screen items-center">
      <ScreenOne />
      <ScreenTwo />
    </div>
  );
}