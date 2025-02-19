import { darkTheme } from '@rainbow-me/rainbowkit'
import merge from 'lodash.merge'

export const customTheme = merge(darkTheme(), {
  colors: {
    accentColor: 'rgb(37,202,172)', // Your fluid-primary color
    connectButtonBackground: 'rgb(37,202,172)',
    connectButtonInnerBackground: 'rgb(37,202,172)',
    modalBackground: '#0f1114', // Dark background matching your app
    modalBorder: 'rgba(255, 255, 255, 0.1)',
  },
  fonts: {
    body: 'inherit',
  },
  radii: {
    actionButton: '12px',
    connectButton: '12px',
    modal: '16px',
  },
})