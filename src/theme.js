import { createTheme, Button } from '@mantine/core';

const GreenColors = [
  '#f6f7f2',
  '#ebece6',
  '#d5d8c8',
  '#bec3a7',
  '#aab28b',
  '#9da679',
  '#96a16f',
  '#828c5d',
  '#737d51',
  '#4b5232',
];

export const theme = createTheme({
  colors: {
    GreenColors,
  },
  primaryColor: 'GreenColors',
  // Darker shade for filled buttons/components
  primaryShade: { light: 8, dark: 8 },
  components: {
    // add a matching border for more definition
    Button: Button.extend({
      styles: (buttonTheme, { variant }) =>
        variant === 'light'
          ? { root: { borderColor: buttonTheme.colors.GreenColors[8] } }
          : {},
    }),
  },
});
