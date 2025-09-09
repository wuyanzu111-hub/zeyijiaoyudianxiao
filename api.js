// API工具类 - 处理与后端服务器的通信
class ApiClient {
    constructor() {
        this.baseUrl = window.location.protocol + '//' + window.location.hostname + ':3000/api';
        this.fallbackToLocalStorage = false;
        this.checkServerConnection();
    }
    
    // 检查服务器连接
    async checkServerConnection() {
        try {
            const response = await fetch(this.baseUrl + '/users');
            if (response.ok) {
                this.fallbackToLocalStorage = false;
                console.log('服务器连接正常');
            } else {
                throw new Error('服务器响应异常');
            }
        } catch (error) {
            console.warn('无法连接到服务器，将使用本地存储模式:', error.message);
            this.fallbackToLocalStorage = true;
        }
    }
    
    // 通用请求方法
    async request(url, options = {}) {
        try {
            const response = await fetch(this.baseUrl + url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }
    
    // 用户认证
    async login(username, password, role) {
        if (this.fallbackToLocalStorage) {
            return this.loginFallback(username, password, role);
        }
        
        try {
            const result = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password, role })
            });
            
            if (result.success) {
                localStorage.setItem('currentUser', JSON.stringify(result.user));
            }
            
            return result;
        } catch (error) {
            // 如果服务器请求失败，回退到本地存储
            console.warn('登录请求失败，使用本地验证');
            return this.loginFallback(username, password, role);
        }
    }
    
    // 本地存储回退登录
    loginFallback(username, password, role) {
        const users = JSON.parse(localStorage.getItem('systemUsers') || '{}');
        const defaultUsers = {
            'admin': { password: 'admin123', role: 'admin', name: '系统管理员' },
            'sales1': { password: 'sales123', role: 'salesperson', name: '业务员1' },
            'sales2': { password: 'sales123', role: 'salesperson', name: '业务员2' },
            'sales3': { password: 'sales123', role: 'salesperson', name: '业务员3' }
        };
        
        const allUsers = { ...defaultUsers, ...users };
        
        if (allUsers[username] && allUsers[username].password === password && allUsers[username].role === role) {
            const user = {
                username,
                role,
                name: allUsers[username].name,
                loginTime: new Date().toISOString(),
                sessionId: Math.random().toString(36).substring(2, 15)
            };
            localStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user };
        } else {
            return { success: false, message: '用户名、密码或角色不正确' };
        }
    }
    
    // 获取用户列表
    async getUsers() {
        if (this.fallbackToLocalStorage) {
            const users = localStorage.getItem('systemUsers');
            return users ? JSON.parse(users) : {};
        }
        
        try {
            return await this.request('/users');
        } catch (error) {
            const users = localStorage.getItem('systemUsers');
            return users ? JSON.parse(users) : {};
        }
    }
    
    // 更新用户列表
    async updateUsers(users) {
        if (this.fallbackToLocalStorage) {
            localStorage.setItem('systemUsers', JSON.stringify(users));
            return { success: true };
        }
        
        try {
            const result = await this.request('/users', {
                method: 'PUT',
                body: JSON.stringify(users)
            });
            // 同时更新本地存储作为备份
            localStorage.setItem('systemUsers', JSON.stringify(users));
            return result;
        } catch (error) {
            localStorage.setItem('systemUsers', JSON.stringify(users));
            return { success: true };
        }
    }
    
    // 获取号码池
    async getPhonePool() {
        if (this.fallbackToLocalStorage) {
            const phonePool = localStorage.getItem('phonePool');
            return phonePool ? JSON.parse(phonePool) : [];
        }
        
        try {
            return await this.request('/phonePool');
        } catch (error) {
            const phonePool = localStorage.getItem('phonePool');
            return phonePool ? JSON.parse(phonePool) : [];
        }
    }
    
    // 更新号码池
    async updatePhonePool(phonePool) {
        if (this.fallbackToLocalStorage) {
            localStorage.setItem('phonePool', JSON.stringify(phonePool));
            return { success: true };
        }
        
        try {
            const result = await this.request('/phonePool', {
                method: 'PUT',
                body: JSON.stringify(phonePool)
            });
            localStorage.setItem('phonePool', JSON.stringify(phonePool));
            return result;
        } catch (error) {
            localStorage.setItem('phonePool', JSON.stringify(phonePool));
            return { success: true };
        }
    }
    
    // 获取分配记录
    async getAssignments() {
        if (this.fallbackToLocalStorage) {
            const assignments = localStorage.getItem('phoneAssignments');
            return assignments ? JSON.parse(assignments) : {};
        }
        
        try {
            return await this.request('/assignments');
        } catch (error) {
            const assignments = localStorage.getItem('phoneAssignments');
            return assignments ? JSON.parse(assignments) : {};
        }
    }
    
    // 更新分配记录
    async updateAssignments(assignments) {
        if (this.fallbackToLocalStorage) {
            localStorage.setItem('phoneAssignments', JSON.stringify(assignments));
            return { success: true };
        }
        
        try {
            const result = await this.request('/assignments', {
                method: 'PUT',
                body: JSON.stringify(assignments)
            });
            localStorage.setItem('phoneAssignments', JSON.stringify(assignments));
            return result;
        } catch (error) {
            localStorage.setItem('phoneAssignments', JSON.stringify(assignments));
            return { success: true };
        }
    }
    
    // 获取用户数据
    async getUserData(username) {
        if (this.fallbackToLocalStorage) {
            const data = localStorage.getItem('phoneDialerData');
            return data ? JSON.parse(data) : { phones: [], totalCalls: 0, lastCallTime: null };
        }
        
        try {
            return await this.request(`/userData/${username}`);
        } catch (error) {
            const data = localStorage.getItem('phoneDialerData');
            return data ? JSON.parse(data) : { phones: [], totalCalls: 0, lastCallTime: null };
        }
    }
    
    // 更新用户数据
    async updateUserData(username, userData) {
        if (this.fallbackToLocalStorage) {
            localStorage.setItem('phoneDialerData', JSON.stringify(userData));
            return { success: true };
        }
        
        try {
            const result = await this.request(`/userData/${username}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            localStorage.setItem('phoneDialerData', JSON.stringify(userData));
            return result;
        } catch (error) {
            localStorage.setItem('phoneDialerData', JSON.stringify(userData));
            return { success: true };
        }
    }
    
    // 清空所有数据
    async clearAllData() {
        if (this.fallbackToLocalStorage) {
            localStorage.removeItem('phonePool');
            localStorage.removeItem('phoneAssignments');
            localStorage.removeItem('phoneNumbers');
            return { success: true };
        }
        
        try {
            const result = await this.request('/data/clear', {
                method: 'DELETE'
            });
            localStorage.removeItem('phonePool');
            localStorage.removeItem('phoneAssignments');
            localStorage.removeItem('phoneNumbers');
            return result;
        } catch (error) {
            localStorage.removeItem('phonePool');
            localStorage.removeItem('phoneAssignments');
            localStorage.removeItem('phoneNumbers');
            return { success: true };
        }
    }
}

// 创建全局API客户端实例
const apiClient = new ApiClient();

// 兼容性函数 - 保持现有代码的兼容性
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('解析用户信息失败:', error);
            return null;
        }
    }
    return null;
}