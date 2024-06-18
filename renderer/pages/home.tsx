import React, { useState } from 'react';
import { Flex } from '@chakra-ui/react';
import ChatbotIframe from '../components/ChatbotIframe';
import SwitchBotDrawer from '../components/SwitchBotDrawer';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  return (
    <React.Fragment>
      <Flex minHeight="100vh" flexDirection="column" width="100%" position="relative">
        {loading && <LoadingSpinner />}
        <ChatbotIframe setLoading={setLoading} style={{ display: loading ? 'none' : 'block' }} />
        {!loading && <SwitchBotDrawer />}
      </Flex>
    </React.Fragment>
  );
}