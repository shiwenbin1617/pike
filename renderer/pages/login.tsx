import React, { useEffect, useState } from 'react';
import { Box, Heading, Container, Text, Flex } from '@chakra-ui/react';
import WeChatLoginComponent from '../components/WeChatLogin';

const WeChatScan = () => {
  const [loginVo, setLoginVo] = useState(null);
  const [redirectUri, setRedirectUri] = useState('http://example.com/callback');
  const [appid, setAppid] = useState('YOUR_APP_ID');
  const [agentid, setAgentid] = useState('YOUR_AGENT_ID');

  // useEffect(() => {
  //   if (router.isReady) {
  //     const { loginVo, redirecturi, appid, agentid } = router.query;

  //     if (loginVo) setLoginVo(JSON.parse(loginVo as string));
  //     if (redirecturi) setRedirectUri(redirecturi as string);
  //     if (appid) setAppid(appid as string);
  //     if (agentid) setAgentid(agentid as string);
  //   }
  // }, [router.isReady, router.query]);

  return (
    <Flex alignItems="center" justifyContent="center" minHeight="100vh" bg="gray.50">
      <Box
        p={6}
        borderWidth={1}
        borderRadius="lg"
        maxWidth="480px"
        width="100%"
        boxShadow="lg"
        textAlign="center"
        bg="white"
      >
        <Heading size="lg" mb={4}>WeChat Scan</Heading>
        <Text fontSize="md" mb={6}>Please scan the QR code below to log in</Text>
        <Box display="flex" justifyContent="center">
          {appid && agentid && redirectUri && (
            <WeChatLoginComponent
              appid={appid}
              agentid={agentid}
              redirectUri={redirectUri}
              panelSize="480x416"
            />
          )}
        </Box>
      </Box>
    </Flex>
  );
};

export default WeChatScan;