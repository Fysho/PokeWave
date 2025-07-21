import React from 'react';
import { Box, Text, Center } from '@mantine/core';

interface BattleSimulationDisplayProps {
  pokemon1?: any;
  pokemon2?: any;
  showResults?: boolean;
  finalResult?: any;
  simulationResults?: any[];
  isSimulating?: boolean;
}

const BattleSimulationDisplay: React.FC<BattleSimulationDisplayProps> = () => {
  return (
    <Box p="md">
      <Center>
        <Text size="sm" c="dimmed">
          Battle simulation visualization coming soon
        </Text>
      </Center>
    </Box>
  );
};

export default BattleSimulationDisplay;