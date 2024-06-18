import React from 'react';
import {
  Radio,
  RadioGroup,
  Stack,
  Box,
} from '@chakra-ui/react';

const SwitchIframe = ({ selectedValue, setSelectedValue }) => {
  return (
    <Box p={4}>
      <RadioGroup onChange={setSelectedValue} value={selectedValue}>
        <Stack direction='column'>
          <Radio value='1'>得力助手</Radio>
          <Radio value='2'>三步翻译</Radio>
        </Stack>
      </RadioGroup>
    </Box>
  );
};

export default SwitchIframe;
