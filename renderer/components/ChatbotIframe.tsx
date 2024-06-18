import React, { useEffect } from 'react';
import { Box } from '@chakra-ui/react';

interface ChatbotIframeProps {
  setLoading: (loading: boolean) => void;
  style?: React.CSSProperties; // 添加 style 属性
}

const ChatbotIframe: React.FC<ChatbotIframeProps> = ({ setLoading, style, ...rest }) => {
  useEffect(() => {
    const iframeId = 'chatbot-iframe';
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;

    const onLoadHandler = () => {
      setLoading(false);
      if (iframe) {
        iframe.style.display = 'block';
      }
    };

    const createIframe = () => {
      setLoading(true);
      if (iframe) {
        iframe.removeEventListener('load', onLoadHandler);
        iframe.parentNode?.removeChild(iframe);
      }
      iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.src = 'http://192.168.0.222/chat/Dday9wkD5B8Jeexc';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.minHeight = '700px';
      iframe.style.display = 'none';
      iframe.style.flex = '1'; // Ensure iframe fills the container
      iframe.frameBorder = '0';
      iframe.addEventListener('load', onLoadHandler);
      document.getElementById('iframe-container')?.appendChild(iframe);
    };

    createIframe();

    return () => {
      if (iframe) {
        iframe.removeEventListener('load', onLoadHandler);
      }
    };
  }, [setLoading]);

  return (
    <Box id="iframe-container" flex="1" display="flex" flexDirection="column" width="100%" style={style} {...rest} />
  );
};

export default ChatbotIframe;