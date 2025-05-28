const express = require('express');
const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const port = 3000;

// 配置iCloud文件夹路径（需要替换为你的实际iCloud文件夹路径）
const iCloudFolderPath = "D:\\iCloudDrive\\iCloudDrive\\HelenMaxTogether"
const publicFolder = path.join(__dirname, 'public');
const imagesFolder = path.join(publicFolder, 'images');
const romFolder = path.join(__dirname, 'Rom');

// 确保public文件夹存在
fs.ensureDirSync(publicFolder);
fs.ensureDirSync(imagesFolder);

// 设置根路由 - 显示pre.html
app.get('/', (req, res) => {
    res.sendFile(path.join(romFolder, 'pre.html'));
});

// 处理main.html的访问
app.get('/main', (req, res) => {
    res.sendFile(path.join(romFolder, 'main.html'));
});

// 提供静态文件服务
app.use('/images', express.static(imagesFolder));  // 提供图片目录的静态文件
app.use(express.static(romFolder));  // 提供Rom目录的静态文件

// 获取图片列表的API
app.get('/images', (req, res) => {
    fs.readdir(imagesFolder, (err, files) => {
        if (err) {
            console.error('Error reading images directory:', err);
            return res.status(500).json({ error: 'Failed to read images directory' });
        }
        // 只返回图片文件
        const imageFiles = files.filter(file => 
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
        );
        res.json(imageFiles);
    });
});

// 监控iCloud文件夹变化
const watcher = chokidar.watch(iCloudFolderPath, {
    ignored: /(^|[\/\\])\../, // 忽略隐藏文件
    persistent: true
});

// 当文件变化时更新图片
watcher.on('all', async (event, filePath) => {
    if (event === 'add' || event === 'change') {
        const fileName = path.basename(filePath);
        const targetPath = path.join(imagesFolder, fileName);
        
        try {
            await fs.copy(filePath, targetPath);
            console.log(`Copied ${fileName} to public/images`);
        } catch (err) {
            console.error(`Error copying ${fileName}:`, err);
        }
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Monitoring folder: ${iCloudFolderPath.replace(/\\/g, '/')}`);
}); 