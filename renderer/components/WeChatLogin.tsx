import React, { useEffect } from 'react';
import { Box, Center } from '@chakra-ui/react';

declare const WwLogin: any;

const WeChatLoginComponent = ({ appid, agentid, redirectUri, state = '', href = '', lang = 'zh', panelSize = '480x416' }) => {
  useEffect(() => {
    console.log('WwLogin:', typeof WwLogin);
    console.log('Props:', { appid, agentid, redirectUri, state, href, lang, panelSize });

    if (typeof WwLogin !== 'undefined') {
      const url = encodeURIComponent(redirectUri);

      new WwLogin({
        id: 'wx_reg',
        appid,
        agentid,
        redirect_uri: url,
        state,
        href,
        lang,
        panel_size: panelSize,
      });
    }
  }, [appid, agentid, redirectUri, state, href, lang, panelSize]);

  // 解析panelSize参数中的宽高
  const [width, height] = panelSize.split('x').map(Number);

  return (
    <Center
      id="wx_reg"
      width={`${width}px`}
      height={`${height}px`}
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg="white" // 背景色为白色，确保视觉效果一致
    ></Center>
  );
};

export default WeChatLoginComponent;