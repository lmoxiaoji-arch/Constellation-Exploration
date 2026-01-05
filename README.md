# Swiss Tech Precision - 光刻效果预览系统

一个用于展示光刻效果的交互式 3D 图像查看器。

## 功能特性

- 🖼️ 多视角 3D 旋转查看（正视图、左视图、俯视图）
- 📊 版本管理系统（支持多个版本对比）
- 🎨 精美的 UI 设计，支持 3D 视差效果
- 📱 响应式设计，支持移动端触控
- 🔄 图像序列平滑切换
- 🎯 ViewCube 3D 导航立方体

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (Canvas API)
- **后端**: Node.js + Express
- **文件上传**: Multer
- **认证**: JWT (JSON Web Tokens)

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务器

```bash
npm start
# 或者
node server.js
```

服务器将在 `http://localhost:3000` 启动。

### 使用 start.bat (Windows)

双击 `start.bat` 文件即可自动启动服务器。

## 目录结构

```
yunmo/
├── public/              # 静态资源
│   ├── index.html      # 主查看器页面
│   ├── home.html       # 首页
│   ├── admin.html      # 管理后台
│   └── project_A/      # 项目资源文件
│       ├── v1/         # 版本 1
│       ├── v2/         # 版本 2
│       ├── v3/         # 版本 3
│       ├── v4/         # 版本 4
│       └── v5/         # 版本 5
├── server.js           # Express 服务器
├── package.json        # 项目配置
└── start.bat          # Windows 启动脚本

```

## 项目说明

此项目用于展示光刻工艺的效果预览，支持多个版本和多个视角的对比查看。

## License

MIT
