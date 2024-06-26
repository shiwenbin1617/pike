import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { Box, Button, Divider, IconButton, Input, InputGroup, InputRightElement, Flex } from '@chakra-ui/react';
import { FaPaperPlane, FaLanguage, FaSearch, FaCloudSun } from 'react-icons/fa';


const Frameless = () => {
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (inputRef.current) {
      //@ts-ignore
      inputRef.current.focus();
    }

    const handleBlur = () => {
      window.electron.send('close-frameless-window', inputValue);
    };

    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handleHappy = () => {
    console.log('Happy!');
  };

  const handleTranslate = () => {
    console.log('进行翻译...', inputValue);
  };

  const handleSearch = () => {
    console.log('进行搜索...', inputValue);
  };

  const handleNextPage = () => {
    console.log('打开主窗口...');
    window.electron.send('open-main-window', inputValue);
  };

  const handleSend = () => {
    handleNextPage();
  };

  return (
    <Flex
      height="100vh"
      width="100vw"
      direction="column"
      alignItems="center"
      background="white" // 纯白色背景
      p={4}
      border="none" // 去掉任何边框
    >
      <Head>
        <title>无框窗口</title>
      </Head>

      {/* 输入框部分，吸顶 */}
      <Box
        width="100%"
        maxW="800px"  // 限制最大宽度
        mx="auto"
        mb={6} // 增加下方间距
      >
        <InputGroup size="lg" width="100%">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="请输入内容"
            px={4}
            py={6}
            borderRadius="0.375rem 0 0 0.375rem" // 调整圆角
            background="white"
            boxShadow="md"
            color="black"
            // borderRight="none" // 移除右侧边框
            _focus={{
              zIndex: 1,
              borderColor: 'blue.300',
              boxShadow: '0 0 0 1px blue.300'
            }}
          />
           <InputRightElement>
            <IconButton
              icon={<FaPaperPlane />}
              size="lg"
              onClick={handleSend}
              aria-label="发送"
              bg="transparent"
              color="black"
              transition="all 0.2s ease-in-out"
              _hover={{ transform: "scale(1.1)" }}
              borderTopLeftRadius={0}
              borderBottomLeftRadius={0}
              borderLeft="none"
              _focus={{ boxShadow: "none" }}
              ml="-1px"
              height="100%"
            />
          </InputRightElement>
        </InputGroup>
      </Box>

      {/* 分界线 */}
      <Divider orientation="horizontal" width="100%" mb={6} borderColor="blackAlpha.600" />

      {/* 功能按钮部分，自适应高度 */}
      <Flex
        direction="column"
        alignItems="center"
        justifyContent="center"
        maxW="800px"
        mx="auto"
        flex="1"
        width="100%"
      >
        <Button
          mb={4}
          width="100%"
          leftIcon={<FaLanguage />}
          justifyContent="left"
          bg="#E1FFFF" // 按钮颜色
          color="black"
          boxShadow="sm"
          transition="all 0.2s ease-in-out"
          _hover={{ boxShadow: 'md', transform: 'translateY(-3px)' }} // 悬停效果
          onClick={handleTranslate}
        >
          翻译
        </Button>
        <Button
          mb={4}
          width="100%"
          leftIcon={<FaSearch />}
          justifyContent="left"
          bg="#E1FFFF" // 按钮颜色
          color="black"
          boxShadow="sm"
          transition="all 0.2s ease-in-out"
          _hover={{ boxShadow: 'md', transform: 'translateY(-3px)' }} //悬停效果
          onClick={handleSearch}
        >
          搜索
        </Button>
        <Button
          width="100%"
          leftIcon={<FaCloudSun />}
          justifyContent="left"
          bg="#E1FFFF" // 按钮颜色
          color="black"
          boxShadow="sm"
          transition="all 0.2s ease-in-out"
          _hover={{ boxShadow: 'md', transform: 'translateY(-3px)' }} // 悬停效果
          onClick={handleHappy}
        >
          Happy!
        </Button>
      </Flex>
    </Flex>
  );
};

export default Frameless;