// ==================== 工具函数部分（从你的 dl.js 复制） ====================
// 内存中的请求频率限制
const rateLimit = new Map();
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  registerWindowMs: 60 * 60 * 1000,
  maxRegisters: 3,
};

// 清理过期记录
function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, record] of rateLimit.entries()) {
    if (now - record.firstRequest > RATE_LIMIT_CONFIG.windowMs) {
      rateLimit.delete(key);
    }
  }
}

// 检查请求频率
function checkRateLimit(ip, action = 'general') {
  cleanupRateLimit();
  
  const key = `${ip}:${action}`;
  const now = Date.now();
  const windowMs = action === 'register' 
    ? RATE_LIMIT_CONFIG.registerWindowMs 
    : RATE_LIMIT_CONFIG.windowMs;
  const maxRequests = action === 'register' 
    ? RATE_LIMIT_CONFIG.maxRegisters 
    : RATE_LIMIT_CONFIG.maxRequests;

  if (!rateLimit.has(key)) {
    rateLimit.set(key, {
      count: 1,
      firstRequest: now,
      lastRequest: now
    });
    return true;
  }

  const record = rateLimit.get(key);
  
  if (now - record.firstRequest > windowMs) {
    record.count = 1;
    record.firstRequest = now;
    record.lastRequest = now;
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  record.lastRequest = now;
  return true;
}

// 消毒函数
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|TRUNCATE)\b)/gi,
    /(\b(OR|AND)\b\s*[\d\w'"]+\s*[=<>])/gi,
    /(['";\\])/g
  ];
  
  let sanitized = input;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  
  return sanitized.trim();
}

// 验证邮箱
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证密码
function isStrongPassword(password) {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,12}$/;
  return passwordRegex.test(password);
}

// URL验证
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// ==================== 数据库查询函数 ====================

  const accountId = 'f014b972b7da7cdb3eec3db9311c8b5e'; 
  const apiToken = 'mjPJGnAZItvAowaHKEWXwJ2M7XmGhFa5ZR0O-NTe';
  const databaseId = '11210f1c-a626-4eeb-9d5a-bad025cd58e8'; 

  try {
    const sanitizedParams = params.map(p => {
      if (typeof p === 'string') return sanitizeInput(p);
      return p;
    });

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: sql,
          params: sanitizedParams
        })
      }
    );

    if (!response.ok) throw new Error(`D1错误: ${response.status}`);
    
    const data = await response.json();
    return data.success ? data.result || [] : [];
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
}

// ==================== 主处理函数（"总机"） ====================
export async function onRequest(context) {
  const { request, env } = context; // env 包含环境变量
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;
  
  // CORS 头 - Cloudflare 自动处理同域名，这里为外部调用准备
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  // 处理 OPTIONS 预检请求
  if (method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  try {
    // 获取客户端IP（Cloudflare 方式）
    const clientIp = request.headers.get('cf-connecting-ip') || 
                     request.headers.get('x-forwarded-for') || 
                     'unknown';
    
    // ========== 路由1：用户注册 (/api/register) ==========
    if (pathname === '/api/register' || pathname === '/api/register/') {
      if (method !== 'POST') {
        return new Response(JSON.stringify({ error: '方法不允许' }), {
          status: 405, headers
        });
      }
      
      // 频率检查
      if (!checkRateLimit(clientIp, 'register')) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: '尝试次数过多1小时后再试' 
        }), { status: 429, headers });
      }
      
      const data = await request.json();
      const { username, password, email, action } = data;
      
      if (action !== 'register') {
        return new Response(JSON.stringify({ 
          success: false, error: '未知操作' 
        }), { status: 400, headers });
      }
      
      // 验证数据（复用你的逻辑）
      const sanitizedUsername = sanitizeInput(username);
      const sanitizedEmail = sanitizeInput(email);
      
      if (!sanitizedUsername || sanitizedUsername.length < 2 || sanitizedUsername.length > 8) {
        return new Response(JSON.stringify({ 
          success: false, error: '用户名必须为2-8个字符' 
        }), { status: 400, headers });
      }
      
      if (!password || !isStrongPassword(password)) {
        return new Response(JSON.stringify({ 
          success: false, error: '密码必须为8-12位，包含字母和数字' 
        }), { status: 400, headers });
      }
      
      if (!sanitizedEmail || !isValidEmail(sanitizedEmail)) {
        return new Response(JSON.stringify({ 
          success: false, error: '请输入有效的邮箱地址' 
        }), { status: 400, headers });
      }
      
      // 检查用户名和邮箱
      const checkUser = await queryD1Database(
        'SELECT id FROM users WHERE username = ?', [sanitizedUsername]
      );
      if (checkUser[0]?.results?.length > 0) {
        return new Response(JSON.stringify({ 
          success: false, error: '用户名已存在' 
        }), { status: 400, headers });
      }
      
      const checkEmail = await queryD1Database(
        'SELECT id FROM users WHERE email = ?', [sanitizedEmail]
      );
      if (checkEmail[0]?.results?.length > 0) {
        return new Response(JSON.stringify({ 
          success: false, error: '邮箱已被注册' 
        }), { status: 400, headers });
      }
      
      // 创建用户
      await queryD1Database(
        `INSERT INTO users (username, password, email, created_at, register_ip) 
         VALUES (?, ?, ?, datetime('now'), ?)`,
        [sanitizedUsername, password, sanitizedEmail, clientIp]
      );
      
      return new Response(JSON.stringify({
        success: true,
        message: '注册成功',
        user: { username: sanitizedUsername, email: sanitizedEmail }
      }), { headers });
    }
    
    // ========== 路由2：友链管理 (/api/friendlink) ==========
    if (pathname === '/api/friendlink' || pathname === '/api/friendlink/') {
      // 频率检查
      if (!checkRateLimit(clientIp, 'friendlink')) {
        return new Response(JSON.stringify({ 
          success: false, error: '请求过于频繁，请稍后再试' 
        }), { status: 429, headers });
      }
      
      // GET：获取友链
      if (method === 'GET') {
        const results = await queryD1Database(
          'SELECT id, name, url, description, email, approved, created_at FROM friend_links WHERE approved = 1 ORDER BY created_at DESC'
        );
        
        return new Response(JSON.stringify({
          success: true,
          data: results[0]?.results || []
        }), { headers });
      }
      
      // POST：提交友链
      if (method === 'POST') {
        const body = await request.json();
        
        const name = sanitizeInput(body.name);
        const url = sanitizeInput(body.url);
        const description = sanitizeInput(body.description || '');
        const email = sanitizeInput(body.email || '');
        
        // 验证
        if (!name || name.length < 2 || name.length > 6) {
          return new Response(JSON.stringify({ 
            success: false, error: '网站名称必须为2-6个字符' 
          }), { status: 400, headers });
        }
        
        if (!url || !isValidUrl(url)) {
          return new Response(JSON.stringify({ 
            success: false, error: '请输入有效的网站地址' 
          }), { status: 400, headers });
        }
        
        // 检查重复
        const checkExisting = await queryD1Database(
          'SELECT id FROM friend_links WHERE url = ?', [url]
        );
        if (checkExisting[0]?.results?.length > 0) {
          return new Response(JSON.stringify({ 
            success: false, error: '该网址已提交过申请' 
          }), { status: 400, headers });
        }
        
        // 插入
        await queryD1Database(
          `INSERT INTO friend_links (name, url, description, email, approved, created_at, submit_ip) 
           VALUES (?, ?, ?, ?, 0, datetime('now'), ?)`,
          [name, url, description, email, clientIp]
        );
        
        return new Response(JSON.stringify({
          success: true,
          message: '友链提交成功，等待审核',
          data: { name, url }
        }), { headers });
      }
      
      return new Response(JSON.stringify({ error: '方法不允许' }), {
        status: 405, headers
      });
    }
    
    // ========== 其他路径 ==========
    return new Response(JSON.stringify({ error: 'API路径未找到' }), {
      status: 404, headers
    });
    
  } catch (error) {
    console.error('服务器错误:', error);
    
    let errorMessage = '服务器内部错误';
    if (error.message.includes('UNIQUE constraint failed')) {
      errorMessage = '用户名或邮箱已存在';
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), { status: 500, headers });
  }
}