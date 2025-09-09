// 电话拨号器 Web应用 - 主要功能实现

class PhoneDialer {
    constructor() {
        this.phones = [];
        this.totalCalls = 0;
        this.lastCallTime = null;
        
        this.initializeElements();
        this.loadData();
        this.bindEvents();
        this.updateUI();
    }

    // 初始化DOM元素引用
    initializeElements() {
        // 输入元素
        this.phoneInput = document.getElementById('phoneInput');
        this.fileInput = document.getElementById('fileInput');
        this.fileUploadArea = document.getElementById('fileUploadArea');
        
        // 按钮元素
        this.addPhonesBtn = document.getElementById('addPhonesBtn');
        this.uploadFileBtn = document.getElementById('uploadFileBtn');
        this.sortBtn = document.getElementById('sortBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        
        // 列表和显示元素
        this.phoneList = document.getElementById('phoneList');
        this.emptyState = document.getElementById('emptyState');
        this.phoneCount = document.getElementById('phoneCount');
        
        // 统计元素
        this.totalCallsEl = document.getElementById('totalCalls');
        this.remainingCountEl = document.getElementById('remainingCount');
        this.lastCallTimeEl = document.getElementById('lastCallTime');
        
        // 模态框元素
        this.confirmModal = document.getElementById('confirmModal');
        this.confirmPhone = document.getElementById('confirmPhone');
        this.confirmCallBtn = document.getElementById('confirmCall');
        this.cancelCallBtn = document.getElementById('cancelCall');
        
        // 通知元素
        this.notification = document.getElementById('notification');
    }

    // 绑定事件监听器
    bindEvents() {
        // 添加号码按钮
        this.addPhonesBtn.addEventListener('click', () => this.addPhones());
        
        // 文件上传
        this.uploadFileBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // 拖拽上传
        this.fileUploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.fileUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.fileUploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // 控制按钮
        this.sortBtn.addEventListener('click', () => this.sortPhones());
        this.clearAllBtn.addEventListener('click', () => this.clearAllPhones());
        
        // 模态框
        this.confirmCallBtn.addEventListener('click', () => this.executeCall());
        this.cancelCallBtn.addEventListener('click', () => this.hideModal());
        this.confirmModal.addEventListener('click', (e) => {
            if (e.target === this.confirmModal) this.hideModal();
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // 输入框回车键
        this.phoneInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.addPhones();
            }
        });
    }

    // 添加电话号码
    addPhones() {
        const input = this.phoneInput.value.trim();
        if (!input) {
            this.showNotification('请输入电话号码', 'error');
            return;
        }

        const lines = input.split('\n').map(line => line.trim()).filter(line => line);
        const validPhones = [];
        const invalidPhones = [];

        lines.forEach(line => {
            const phone = this.cleanPhoneNumber(line);
            if (this.isValidPhone(phone)) {
                if (!this.phones.includes(phone)) {
                    validPhones.push(phone);
                }
            } else {
                invalidPhones.push(line);
            }
        });

        if (validPhones.length > 0) {
            this.phones.push(...validPhones);
            this.sortPhones();
            this.phoneInput.value = '';
            this.saveData();
            this.updateUI();
            
            let message = `成功添加 ${validPhones.length} 个号码`;
            if (invalidPhones.length > 0) {
                message += `，${invalidPhones.length} 个号码格式无效`;
            }
            this.showNotification(message, 'success');
        } else {
            this.showNotification('没有有效的电话号码', 'error');
        }
    }

    // 处理文件上传
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.match(/\.(txt|csv)$/i)) {
            this.showNotification('请选择 .txt 或 .csv 文件', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.phoneInput.value = content;
            this.addPhones();
        };
        reader.readAsText(file);
        
        // 清空文件输入
        event.target.value = '';
    }

    // 拖拽处理
    handleDragOver(e) {
        e.preventDefault();
        this.fileUploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.fileInput.files = files;
            this.handleFileUpload({ target: { files } });
        }
    }

    // 清理电话号码格式
    cleanPhoneNumber(phone) {
        return phone.replace(/[^0-9]/g, '');
    }

    // 验证电话号码
    isValidPhone(phone) {
        // 支持7-15位数字的电话号码
        return /^\d{7,15}$/.test(phone);
    }

    // 排序电话号码
    sortPhones() {
        this.phones.sort((a, b) => {
            // 按数字大小排序
            return parseInt(a) - parseInt(b);
        });
        this.saveData();
        this.updateUI();
        this.showNotification('号码已重新排序', 'info');
    }

    // 清空所有号码
    clearAllPhones() {
        if (this.phones.length === 0) {
            this.showNotification('列表已经是空的', 'info');
            return;
        }

        if (confirm(`确定要清空所有 ${this.phones.length} 个号码吗？`)) {
            this.phones = [];
            this.saveData();
            this.updateUI();
            this.showNotification('已清空所有号码', 'success');
        }
    }

    // 显示拨打确认对话框
    showCallConfirm(phone) {
        this.confirmPhone.textContent = phone;
        this.confirmModal.classList.add('show');
        this.currentCallPhone = phone;
    }

    // 隐藏模态框
    hideModal() {
        this.confirmModal.classList.remove('show');
        this.currentCallPhone = null;
    }

    // 执行拨打电话
    executeCall() {
        if (!this.currentCallPhone) return;

        const phone = this.currentCallPhone;
        this.hideModal();

        // 显示拨打状态
        const phoneItem = document.querySelector(`[data-phone="${phone}"]`);
        if (phoneItem) {
            phoneItem.classList.add('calling');
        }

        // 模拟拨打延迟
        setTimeout(() => {
            // 尝试拨打电话
            const telUrl = `tel:${phone}`;
            
            // 创建隐藏的链接并点击
            const link = document.createElement('a');
            link.href = telUrl;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // 更新统计
            this.totalCalls++;
            this.lastCallTime = new Date();

            // 从列表中移除号码
            this.removePhone(phone);

            this.showNotification(`已拨打 ${phone}`, 'success');
        }, 1000);
    }

    // 直接拨打（点击号码）
    callPhone(phone) {
        this.showCallConfirm(phone);
    }

    // 移除单个号码
    removePhone(phone) {
        const index = this.phones.indexOf(phone);
        if (index > -1) {
            this.phones.splice(index, 1);
            this.saveData();
            this.updateUI();
        }
    }

    // 删除号码（带确认）
    deletePhone(phone) {
        if (confirm(`确定要删除号码 ${phone} 吗？`)) {
            this.removePhone(phone);
            this.showNotification(`已删除号码 ${phone}`, 'info');
        }
    }

    // 更新UI显示
    updateUI() {
        this.updatePhoneList();
        this.updateStats();
    }

    // 更新电话号码列表
    updatePhoneList() {
        // 更新计数
        this.phoneCount.textContent = this.phones.length;

        // 显示/隐藏空状态
        if (this.phones.length === 0) {
            this.emptyState.style.display = 'flex';
            this.phoneList.style.display = 'none';
        } else {
            this.emptyState.style.display = 'none';
            this.phoneList.style.display = 'flex';
        }

        // 清空并重建列表
        this.phoneList.innerHTML = '';

        this.phones.forEach((phone, index) => {
            const li = document.createElement('li');
            li.className = 'phone-item';
            li.setAttribute('data-phone', phone);
            
            li.innerHTML = `
                <div class="phone-number">
                    <i class="fas fa-phone"></i>
                    ${phone}
                </div>
                <div class="phone-actions">
                    <button class="action-btn call-btn" onclick="phoneDialer.callPhone('${phone}')">
                        <i class="fas fa-phone"></i> 拨打
                    </button>
                    <button class="action-btn delete-btn" onclick="phoneDialer.deletePhone('${phone}')">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            `;

            // 点击号码直接拨打
            li.addEventListener('click', (e) => {
                if (!e.target.closest('.phone-actions')) {
                    this.callPhone(phone);
                }
            });

            this.phoneList.appendChild(li);
        });
    }

    // 更新统计信息
    updateStats() {
        this.totalCallsEl.textContent = this.totalCalls;
        this.remainingCountEl.textContent = this.phones.length;
        
        if (this.lastCallTime) {
            this.lastCallTimeEl.textContent = this.lastCallTime.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            this.lastCallTimeEl.textContent = '--:--';
        }
    }

    // 显示通知
    showNotification(message, type = 'info') {
        this.notification.textContent = message;
        this.notification.className = `notification ${type}`;
        this.notification.classList.add('show');

        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }

    // 键盘快捷键处理
    handleKeyboard(e) {
        // ESC 关闭模态框
        if (e.key === 'Escape') {
            this.hideModal();
        }
        
        // Ctrl+S 排序
        if (e.key === 's' && e.ctrlKey) {
            e.preventDefault();
            this.sortPhones();
        }
        
        // Ctrl+D 清空
        if (e.key === 'd' && e.ctrlKey) {
            e.preventDefault();
            this.clearAllPhones();
        }
    }

    // 保存数据到本地存储
    saveData() {
        const data = {
            phones: this.phones,
            totalCalls: this.totalCalls,
            lastCallTime: this.lastCallTime
        };
        localStorage.setItem('phoneDialerData', JSON.stringify(data));
    }

    // 从本地存储加载数据
    loadData() {
        try {
            const data = localStorage.getItem('phoneDialerData');
            if (data) {
                const parsed = JSON.parse(data);
                this.phones = parsed.phones || [];
                this.totalCalls = parsed.totalCalls || 0;
                this.lastCallTime = parsed.lastCallTime ? new Date(parsed.lastCallTime) : null;
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            this.showNotification('加载历史数据失败', 'error');
        }
    }

    // 导出数据
    exportData() {
        if (this.phones.length === 0) {
            this.showNotification('没有数据可导出', 'error');
            return;
        }

        const content = this.phones.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `电话号码_${new Date().toISOString().split('T')[0]}.txt`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        this.showNotification('数据已导出', 'success');
    }

    // 获取统计信息
    getStats() {
        return {
            totalPhones: this.phones.length,
            totalCalls: this.totalCalls,
            lastCallTime: this.lastCallTime,
            averagePhoneLength: this.phones.length > 0 
                ? (this.phones.reduce((sum, phone) => sum + phone.length, 0) / this.phones.length).toFixed(1)
                : 0
        };
    }
}

// 初始化应用
let phoneDialer;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    phoneDialer = new PhoneDialer();
    
    // 添加一些示例快捷键提示
    console.log('电话拨号器快捷键:');
    console.log('Ctrl+Enter: 添加号码');
    console.log('Ctrl+S: 排序号码');
    console.log('Ctrl+D: 清空所有');
    console.log('ESC: 关闭对话框');
});

// 防止页面意外关闭时丢失数据
window.addEventListener('beforeunload', (e) => {
    if (phoneDialer && phoneDialer.phones.length > 0) {
        phoneDialer.saveData();
    }
});

// 导出全局函数供HTML调用
window.phoneDialer = phoneDialer;