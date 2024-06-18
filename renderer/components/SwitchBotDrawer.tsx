import React, { useState, useRef } from 'react';
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  DrawerOverlay,
  DrawerFooter,
  useDisclosure,
} from '@chakra-ui/react';
import SwitchIframe from './SwitchIframe';

const SwitchBotDrawer = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();
  const [selectedValue, setSelectedValue] = useState('1');

  const handleConfirm = () => {
    const iframe = document.getElementById('chatbot-iframe');
    if (iframe) {
      switch (selectedValue) {
        case '1':
           // @ts-ignore
          iframe.src = 'http://192.168.0.222/chat/Dday9wkD5B8Jeexc';
          break;
        case '2':
           // @ts-ignore
          iframe.src = 'http://192.168.0.222/workflow/OSJXFPEne6fGABsj';
          break;
        default:
          break;
      }
    }
    onClose();
  };

  return (
    <>
      <Button
        ref={btnRef}
        colorScheme='blue'
        onClick={onOpen}
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          zIndex: 1000,
          borderRadius: '50px',
        }}
      >
        切换机器人
      </Button>
      <Drawer
        isOpen={isOpen}
        placement='left'
        onClose={onClose}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>切换机器人</DrawerHeader>

          <DrawerBody>
            <SwitchIframe selectedValue={selectedValue} setSelectedValue={setSelectedValue} />
          </DrawerBody>

          <DrawerFooter>
            <Button variant='outline' mr={3} onClick={onClose} borderRadius="50px" color={"red"} borderColor={'red'}>
              取消
            </Button>
            <Button colorScheme='blue' onClick={handleConfirm} borderRadius="50px">
              确定
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SwitchBotDrawer;
