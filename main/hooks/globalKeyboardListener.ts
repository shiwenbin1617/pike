import { globalShortcut } from 'electron';

export const setupGlobalShortcutListener = (shortcut: string, callback: () => void) => {
  // 注册全局快捷键
  const registered = globalShortcut.register(shortcut, callback);

  if (!registered) {
    console.error(`Failed to register shortcut: ${shortcut}`);
  } else {
    console.log(`Global shortcut registered: ${shortcut}`);
  }

  // 取消注册快捷键函数
  return () => {
    globalShortcut.unregister(shortcut);
    console.log(`Global shortcut unregistered: ${shortcut}`);
  };
};