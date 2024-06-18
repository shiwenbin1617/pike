import React from 'react';
import {
  Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton,
  PopoverHeader, PopoverBody, PopoverFooter, Button, Portal
} from '@chakra-ui/react';
import { FaCopy, FaRegSmile } from 'react-icons/fa';

interface ToolbarProps {
  selectedText: string;
  rect: DOMRect | null;
  onClose: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ selectedText, rect, onClose }) => {
  const handleCopy = async (text: string) => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        console.log('文本已复制到剪贴板');
      } catch (err) {
        console.error('复制文本失败: ', err);
      }
    } else {
      console.error('剪贴板 API 不支持');
    }
  };

  if (!rect) {
    return null;
  }

  return (
    <Popover isOpen={true} placement="top" closeOnBlur={false}>
      <PopoverTrigger>
        <span
          style={{
            position: 'absolute',
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            zIndex: 1,
          }}
        />
      </PopoverTrigger>
      <Portal>
        <PopoverContent>
          <PopoverArrow />
          <PopoverHeader>选中文本</PopoverHeader>
          <PopoverCloseButton onClick={onClose} />
          <PopoverBody>
            <p>{selectedText}</p>
            <Button colorScheme="blue" onClick={() => handleCopy(selectedText)}>
              <FaCopy style={{ marginRight: '5px' }} />
              复制
            </Button>
            <div style={{ marginTop: '10px' }}>
              <FaRegSmile style={{ fontSize: '24px', color: '#007bff' }} />
            </div>
          </PopoverBody>
          <PopoverFooter>这是底部</PopoverFooter>
        </PopoverContent>
      </Portal>
    </Popover>
  );
};

export default Toolbar;