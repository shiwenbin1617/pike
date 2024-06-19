import { GlobalKeyboardListener } from "node-global-key-listener";

// 全局键盘监听器实例
const gkl = new GlobalKeyboardListener();

const CLICK_TIMEOUT = 200; // 检测单击和双击的超时时间，单位：毫秒
const DRAG_THRESHOLD = 5; // 拖动阈值，单位：像素

interface Position {
  x: number;
  y: number;
}

let initialPosition: Position | null = null;
let isMouseDown = false;
let clickCount = 0;
let clickTimer: any;

function trackMouseEvents(
    button: "MOUSE LEFT" | "MOUSE RIGHT",
    onClick: (x: number, y: number, count: number) => void,
    onDoubleClick?: (x: number, y: number, count: number) => Promise<void>,
    onLeftDrag?: (startX: number, startY: number, endX: number, endY: number) => void
) {
  gkl.addListener((e: any) => {
    const x = e.location ? e.location[0] : undefined;
    const y = e.location ? e.location[1] : undefined;

    if (e.name === button) {
      if (e.state === "DOWN" && x !== undefined && y !== undefined) {
        initialPosition = { x, y };
        isMouseDown = true;
        clickCount++;
      } else if (e.state === "UP" && x !== undefined && y !== undefined) {
        isMouseDown = false;

        const isDrag = initialPosition && (
          Math.abs(initialPosition.x - x) > DRAG_THRESHOLD ||
          Math.abs(initialPosition.y - y) > DRAG_THRESHOLD
        );

        if (isDrag && onLeftDrag) {
          onLeftDrag(initialPosition.x, initialPosition.y, x, y); // 处理拖动
          clickCount = 0; // 如果发生拖动，则不再处理点击计数，重置计数器
          clearTimeout(clickTimer); // 清除定时器
        } else {
          if (clickCount === 1) {
            clickTimer = setTimeout(() => {
              if (clickCount === 1) {
                onClick(x, y, clickCount); // 处理单击
              }
              clickCount = 0;
            }, CLICK_TIMEOUT);
          } else if (clickCount === 2 && onDoubleClick) {
            clearTimeout(clickTimer); // 清除单击定时器
            (async () => {
              await onDoubleClick(x, y, clickCount); // 处理双击
            })();
            clickCount = 0; // 重置计数器
          }
        }

        initialPosition = null;
      }
    }
  }).catch(console.error);
}

// 处理左键点击、双击和拖动事件
export function trackLeftClick(
  onLeftClick: (x: number, y: number, count: number) => void,
  onLeftDoubleClick?: (x: number, y: number, count: number) => Promise<void>,
  onLeftDrag?: (startX: number, startY: number, endX: number, endY: number) => void
) {
  trackMouseEvents("MOUSE LEFT", onLeftClick, onLeftDoubleClick, onLeftDrag);
}

// 处理右键点击、双击和拖动事件
export function trackRightClick(
  onRightClick: (x: number, y: number, count: number) => void,
  onRightDoubleClick?: (x: number, y: number, count: number) => Promise<void>,
  onRightDrag?: (startX: number, startY: number, endX: number, endY: number) => void
) {
  trackMouseEvents("MOUSE RIGHT", onRightClick, onRightDoubleClick, onRightDrag);
}