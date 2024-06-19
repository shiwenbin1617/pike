import { clipboard, nativeImage } from 'electron';
import robot from '@hurdlegroup/robotjs';

const COPY_TIMEOUT = 300; // 增加超时时间为了确保复制操作完成
const WAIT_INTERVAL = 10; // 等待间隔时间

let isProgrammaticCopy = false;

export const getSelected = async () => {
    // 备份剪贴板内容
    const originalClipboard = {
        text: clipboard.readText(),
        fileUrl: clipboard.read('public.file-url' as any),
        image: clipboard.readImage(),
        rtf: clipboard.readRTF(),
        html: clipboard.readHTML(),
    };

    // 清空剪贴板
    clipboard.clear();

    // 定义变量存储新的剪贴板内容
    let newText = '';
    let newFileUrl = '';

    // 标记为程序触发的复制操作并记录时间
    isProgrammaticCopy = true;
    const startTime = Date.now();

    const checkClipboard = () => {
        newText = clipboard.readText();
        newFileUrl = clipboard.read('public.file-url' as any);
        return newText !== '' || newFileUrl !== '';
    };

    const platform = process.platform;

    // 执行复制操作
    if (platform === 'darwin') {
        robot.keyTap('c', 'command');
    } else {
        robot.keyTap('c', 'control');
    }

    // 等待剪贴板内容变化
    let timeWaited = 0;
    while (timeWaited < COPY_TIMEOUT) {
        if (checkClipboard()) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, WAIT_INTERVAL));
        timeWaited += WAIT_INTERVAL;
    }

    // 获取新的剪贴板内容
    if (!checkClipboard()) {
        newText = clipboard.readText() || '';
        newFileUrl = clipboard.read('public.file-url' as any);
    }

    // 恢复原来的剪贴板内容
    clipboard.clear();

    if (originalClipboard.text) {
        clipboard.writeText(originalClipboard.text);
    }
    if (originalClipboard.fileUrl) {
        clipboard.write({ 'public.file-url': originalClipboard.fileUrl } as any);
    }
    if (!originalClipboard.image.isEmpty()) {
        clipboard.writeImage(originalClipboard.image);
    }
    if (originalClipboard.rtf) {
        clipboard.writeRTF(originalClipboard.rtf);
    }
    if (originalClipboard.html) {
        clipboard.writeHTML(originalClipboard.html);
    }

    // 重置标志位
    isProgrammaticCopy = false;

    // 返回新的剪贴板内容
    return {
        text: newText,
        fileUrl: newFileUrl,
    };
};

// 实时对剪贴板的监听
const monitorClipboard = () => {
    let previousContent = clipboard.readText();

    setInterval(() => {
        const currentContent = clipboard.readText();
        if (!isProgrammaticCopy && currentContent !== previousContent) {
            console.log('用户更新了剪贴板内容:', currentContent);
            previousContent = currentContent;
        }
    }, 100); // 每隔100ms检查一次剪贴板内容
};

// 启动对剪贴板的监听
monitorClipboard();