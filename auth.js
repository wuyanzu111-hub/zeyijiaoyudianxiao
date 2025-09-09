// 用户认证系统
class AuthSystem {
    constructor() {
        this.users = {
            // 管理员账户
            'admin': {
                password: 'admin123',
                role: 'admin',
                name: '系统管理员'
            },
            // 业务员账户
            'sales1': {
                password: 'sales123',
                role: 'salesperson',
                name: '业务员1'
            },
            'sales2': {
                password: 'sales123',
                role: 'salesperson',
                name: '业务员2'
            },
            'sales3': {
                password: 'sales123',
                role: 'salesperson',
                name: '业务员3'
            }
        };
        
        this.currentUser = null;
        this.init();
    }
    
    init() {
        // 检查是否已登录
        this.checkLoginStatus();
        
        // 绑定登录表单事件
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }
    
    checkLoginStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                
                // 检查会话是否过期（24小时）
                const loginTime = new Date(this.currentUser.loginTime);
                const now = new Date();
                const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
                
                if (hoursDiff > 24) {
                    this.logout();
                    this.showNotification('会话已过期，请重新登录', 'error');
                    return;
                }
                
                // 如果已登录，重定向到相应页面
                if (window.location.pathname.includes('login.html')) {
                    this.redirectToApp();
                }
            } catch (error) {
                console.error('解析用户信息失败:', error);
                this.logout();
            }
        } else {
            // 如果未登录且不在登录页面，重定向到登录页面
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        
        if (!username || !password || !role) {
            this.showNotification('请填写完整的登录信息', 'error');
            return;
        }
        
        // 防止暴力破解 - 检查登录尝试次数
        const attemptKey = `loginAttempts_${username}`;
        const attempts = parseInt(localStorage.getItem(attemptKey) || '0');
        const lastAttemptTime = localStorage.getItem(`lastAttempt_${username}`);
        
        if (attempts >= 5) {
            const timeDiff = Date.now() - parseInt(lastAttemptTime || '0');
            if (timeDiff < 15 * 60 * 1000) { // 15分钟锁定
                this.showNotification('登录尝试次数过多，请15分钟后再试', 'error');
                return;
            } else {
                // 重置尝试次数
                localStorage.removeItem(attemptKey);
                localStorage.removeItem(`lastAttempt_${username}`);
            }
        }
        
        try {
            // 使用API进行登录验证
            const result = await apiClient.login(username, password, role);
            
            if (result.success) {
                // 清除登录尝试记录
                localStorage.removeItem(attemptKey);
                localStorage.removeItem(`lastAttempt_${username}`);
                
                this.currentUser = result.user;
                
                // 记录登录日志
                this.logUserActivity('login', username);
                
                this.showNotification('登录成功！', 'success');
                
                // 延迟跳转
                setTimeout(() => {
                    this.redirectToApp();
                }, 1000);
            } else {
                // 记录失败尝试
                localStorage.setItem(attemptKey, (attempts + 1).toString());
                localStorage.setItem(`lastAttempt_${username}`, Date.now().toString());
                
                this.showNotification(result.message || '用户名、密码或角色不正确', 'error');
            }
        } catch (error) {
            console.error('登录请求失败:', error);
            this.showNotification('登录失败，请检查网络连接', 'error');
        }
    }
    
    validateUser(username, password, role) {
        const user = this.users[username];
        return user && user.password === password && user.role === role;
    }
    
    redirectToApp() {
        if (this.currentUser.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
    }
    
    logout() {
        if (this.currentUser) {
            this.logUserActivity('logout', this.currentUser.username);
        }
        
        localStorage.removeItem('currentUser');
        localStorage.removeItem('assignedPhones');
        this.currentUser = null;
        window.location.href = 'login.html';
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    requireAuth(requiredRole = null) {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return false;
        }
        
        if (requiredRole && this.currentUser.role !== requiredRole) {
            this.showNotification('权限不足', 'error');
            return false;
        }
        
        return true;
    }
    
    generateSessionId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    logUserActivity(action, username) {
        const logs = JSON.parse(localStorage.getItem('userActivityLogs') || '[]');
        logs.push({
            action: action,
            username: username,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        
        // 只保留最近100条日志
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('userActivityLogs', JSON.stringify(logs));
    }
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// 初始化认证系统
const auth = new AuthSystem();

// 全局函数
function logout() {
    auth.logout();
}

function getCurrentUser() {
    return auth.getCurrentUser();
}

function requireAuth(role = null) {
    return auth.requireAuth(role);
}