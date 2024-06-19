import {clipboard} from 'electron';
import robot from '@hurdlegroup/robotjs';

const COPY_TIMEOUT = 300; // 超时时间延长足够复制操作完成

export const getSelected = async () => {
    // 缓存之前的文案
    const lastText = clipboard.readText('clipboard');
    // 判断当前平台
    const platform = process.platform;

    // 执行复制动作
    if (platform === 'darwin') {
        robot.keyTap('c', 'command');

    } else {
        robot.keyTap('c', 'control');
    }

    // 等待一段时间以确保复制操作完成
    await new Promise(resolve => setTimeout(resolve, COPY_TIMEOUT));

    // 读取剪切板内容
    const text = clipboard.readText('clipboard') || '';
    const fileUrl = clipboard.read('public.file-url');

    // 恢复剪切板内容
    clipboard.writeText(lastText);

    // 解析出结果
    return {
        text,
        fileUrl
    };
};