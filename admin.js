// 管理员控制台
class AdminPanel {
    constructor() {
        this.phonePool = [];
        this.users = {};
        this.assignments = {};
        this.init();
    }
    
    init() {
        // 验证管理员权限
        if (!requireAuth('admin')) {
            return;
        }
        
        // 初始化用户信息
        this.loadUsers();
        this.loadPhonePool();
        this.loadAssignments();
        
        // 绑定事件
        this.bindEvents();
        
        // 更新界面
        this.updateUI();
        
        // 显示欢迎信息
        const currentUser = getCurrentUser();
        if (currentUser) {
            document.getElementById('welcomeText').textContent = `欢迎，${currentUser.name}`;
        }
    }
    
    bindEvents() {
        // 文件上传
        const fileInput = document.getElementById('phoneFileInput');
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // 拖拽上传
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        
        // 按钮事件
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('phoneFileInput').click();
        });
        
        document.getElementById('distributeBtn').addEventListener('click', () => {
            this.distributePhones();
        });
        
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAllData();
        });
        
        document.getElementById('addUserBtn').addEventListener('click', () => {
            this.showAddUserModal();
        });
        
        // 添加用户表单
        document.getElementById('addUserForm').addEventListener('submit', (e) => {
            this.handleAddUser(e);
        });
    }
    
    loadUsers() {
        const savedUsers = localStorage.getItem('systemUsers');
        if (savedUsers) {
            this.users = JSON.parse(savedUsers);
        } else {
            // 默认用户
            this.users = {
                'admin': { password: 'admin123', role: 'admin', name: '系统管理员' },
                'sales1': { password: 'sales123', role: 'salesperson', name: '业务员1' },
                'sales2': { password: 'sales123', role: 'salesperson', name: '业务员2' },
                'sales3': { password: 'sales123', role: 'salesperson', name: '业务员3' }
            };
            this.saveUsers();
        }
    }
    
    saveUsers() {
        localStorage.setItem('systemUsers', JSON.stringify(this.users));
    }
    
    loadPhonePool() {
        const savedPool = localStorage.getItem('phonePool');
        if (savedPool) {
            this.phonePool = JSON.parse(savedPool);
        }
    }
    
    savePhonePool() {
        localStorage.setItem('phonePool', JSON.stringify(this.phonePool));
    }
    
    loadAssignments() {
        const savedAssignments = localStorage.getItem('phoneAssignments');
        if (savedAssignments) {
            this.assignments = JSON.parse(savedAssignments);
        }
    }
    
    saveAssignments() {
        localStorage.setItem('phoneAssignments', JSON.stringify(this.assignments));
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }
    
    handleDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }
    
    processFile(file) {
        if (!file.name.match(/\.(txt|csv)$/i)) {
            this.showNotification('请选择 .txt 或 .csv 格式的文件', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.parsePhoneNumbers(content);
        };
        reader.readAsText(file);
    }
    
    parsePhoneNumbers(content) {
        const lines = content.split('\n');
        const newPhones = [];
        
        lines.forEach(line => {
            const phone = line.trim().replace(/[^0-9]/g, '');
            if (phone.length >= 10 && phone.length <= 15) {
                if (!this.phonePool.includes(phone)) {
                    newPhones.push(phone);
                }
            }
        });
        
        if (newPhones.length > 0) {
            this.phonePool.push(...newPhones);
            this.savePhonePool();
            this.updateUI();
            this.showNotification(`成功添加 ${newPhones.length} 个号码`, 'success');
        } else {
            this.showNotification('未找到有效的电话号码', 'error');
        }
    }
    
    distributePhones() {
        const salespeople = Object.keys(this.users).filter(username => 
            this.users[username].role === 'salesperson'
        );
        
        if (salespeople.length === 0) {
            this.showNotification('没有业务员账户可以分配号码', 'error');
            return;
        }
        
        if (this.phonePool.length === 0) {
            this.showNotification('号码池为空，请先上传号码', 'error');
            return;
        }
        
        // 清空之前的分配
        this.assignments = {};
        
        // 随机打乱号码池
        const shuffledPhones = [...this.phonePool].sort(() => Math.random() - 0.5);
        
        // 平均分配
        const phonesPerPerson = Math.floor(shuffledPhones.length / salespeople.length);
        const remainder = shuffledPhones.length % salespeople.length;
        
        let phoneIndex = 0;
        salespeople.forEach((username, index) => {
            const phoneCount = phonesPerPerson + (index < remainder ? 1 : 0);
            this.assignments[username] = shuffledPhones.slice(phoneIndex, phoneIndex + phoneCount);
            phoneIndex += phoneCount;
        });
        
        this.saveAssignments();
        this.updateUI();
        
        const totalAssigned = Object.values(this.assignments).reduce((sum, phones) => sum + phones.length, 0);
        this.showNotification(`成功分配 ${totalAssigned} 个号码给 ${salespeople.length} 个业务员`, 'success');
    }
    
    clearAllData() {
        if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
            this.phonePool = [];
            this.assignments = {};
            localStorage.removeItem('phonePool');
            localStorage.removeItem('phoneAssignments');
            localStorage.removeItem('phoneNumbers');
            this.updateUI();
            this.showNotification('所有数据已清空', 'success');
        }
    }
    
    showAddUserModal() {
        document.getElementById('addUserModal').style.display = 'block';
    }
    
    handleAddUser(e) {
        e.preventDefault();
        
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newUserRole').value;
        const name = document.getElementById('newUserName').value.trim();
        
        if (this.users[username]) {
            this.showNotification('用户名已存在', 'error');
            return;
        }
        
        this.users[username] = { password, role, name };
        this.saveUsers();
        this.updateUI();
        this.closeAddUserModal();
        this.showNotification(`用户 ${name} 添加成功`, 'success');
    }
    
    deleteUser(username) {
        if (username === 'admin') {
            this.showNotification('不能删除管理员账户', 'error');
            return;
        }
        
        if (confirm(`确定要删除用户 ${this.users[username].name} 吗？`)) {
            delete this.users[username];
            delete this.assignments[username];
            this.saveUsers();
            this.saveAssignments();
            this.updateUI();
            this.showNotification('用户删除成功', 'success');
        }
    }
    
    updateUI() {
        this.updatePhonePool();
        this.updateUsersList();
        this.updateStats();
    }
    
    updatePhonePool() {
        const content = document.getElementById('phonePoolContent');
        const totalElement = document.getElementById('totalPhones');
        
        totalElement.textContent = this.phonePool.length;
        
        if (this.phonePool.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <i>📞</i>
                    <p>暂无号码，请先上传号码文件</p>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="phone-grid">
                    ${this.phonePool.map(phone => `<div class="phone-item">${phone}</div>`).join('')}
                </div>
            `;
        }
    }
    
    updateUsersList() {
        const container = document.getElementById('usersList');
        const userEntries = Object.entries(this.users);
        
        container.innerHTML = userEntries.map(([username, user]) => {
            const assignedCount = this.assignments[username] ? this.assignments[username].length : 0;
            const isOnline = username === getCurrentUser()?.username;
            
            return `
                <div class="user-item">
                    <div class="user-name" data-label="用户名">${user.name} (${username})</div>
                    <div class="user-role" data-label="角色">${user.role === 'admin' ? '管理员' : '业务员'}</div>
                    <div class="user-phones" data-label="分配号码">${assignedCount}</div>
                    <div class="user-status" data-label="状态">
                        <span class="${isOnline ? 'status-online' : 'status-offline'}">
                            ${isOnline ? '在线' : '离线'}
                        </span>
                    </div>
                    <div class="user-actions" data-label="操作">
                        ${username !== 'admin' ? `
                            <button class="btn btn-danger" onclick="adminPanel.deleteUser('${username}')">删除</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updateStats() {
        const totalPhones = this.phonePool.length;
        const distributedPhones = Object.values(this.assignments).reduce((sum, phones) => sum + phones.length, 0);
        const activeUsers = Object.keys(this.users).filter(username => this.users[username].role === 'salesperson').length;
        
        document.getElementById('totalPhonesCount').textContent = totalPhones;
        document.getElementById('distributedCount').textContent = distributedPhones;
        document.getElementById('activeUsersCount').textContent = activeUsers;
    }
    
    closeAddUserModal() {
        document.getElementById('addUserModal').style.display = 'none';
        document.getElementById('addUserForm').reset();
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

// 全局函数
function closeAddUserModal() {
    adminPanel.closeAddUserModal();
}

// 点击模态框外部关闭
window.addEventListener('click', (e) => {
    const modal = document.getElementById('addUserModal');
    if (e.target === modal) {
        closeAddUserModal();
    }
});

// 初始化管理员面板
const adminPanel = new AdminPanel();