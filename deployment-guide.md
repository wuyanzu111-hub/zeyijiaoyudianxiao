# 部署指南

## 生产环境部署步骤

### 1. 环境准备
- 确保服务器已安装 Node.js (版本 >= 14)
- 确保服务器有足够的磁盘空间存储数据文件

### 2. 文件上传
将整个项目文件夹上传到服务器，包括：
- 所有 `.js` 文件
- 所有 `.html` 文件
- 所有 `.css` 文件
- `package.json` 和 `package-lock.json`

### 3. 安装依赖
```bash
npm install
```

### 4. 环境变量配置
创建 `.env` 文件（可选）：
```
PORT=3000
NODE_ENV=production
```

### 5. 启动服务

#### 开发模式
```bash
npm start
```

#### 生产模式（推荐使用 PM2）
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name "phone-dialer-system"

# 查看状态
pm2 status

# 查看日志
pm2 logs phone-dialer-system
```

### 6. 防火墙配置
确保服务器防火墙允许访问配置的端口（默认 3000）

### 7. 反向代理配置（可选）
如果使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 常见问题解决

### 连接错误 (ERR_CONNECTION_CLOSED)
1. 检查服务器是否正常运行：访问 `http://your-server:3000/api/health`
2. 检查防火墙设置
3. 确认端口没有被其他程序占用
4. 检查服务器日志：`pm2 logs phone-dialer-system`

### 数据丢失问题
- 数据存储在 `data/` 目录下
- 建议定期备份 `data/` 目录
- 可以设置自动备份脚本

### 性能优化
1. 使用 PM2 集群模式：`pm2 start server.js -i max`
2. 启用 gzip 压缩
3. 配置静态文件缓存

## 监控和维护

### 健康检查
访问 `/api/health` 端点检查服务状态

### 日志管理
```bash
# PM2 日志轮转
pm2 install pm2-logrotate

# 查看实时日志
pm2 logs --lines 100
```

### 数据备份
```bash
# 创建备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backup_$DATE.tar.gz data/
```