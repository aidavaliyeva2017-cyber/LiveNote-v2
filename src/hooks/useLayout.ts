import { useWindowDimensions } from 'react-native';

export const useLayout = () => {
  const { width, height } = useWindowDimensions();
  const isLargeScreen = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isPortrait = height >= width;

  return {
    width,
    height,
    isLargeScreen,
    isTablet,
    isPortrait,
  };
};

