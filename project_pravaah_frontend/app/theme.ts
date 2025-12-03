"use client";
import { createTheme } from '@mui/material/styles';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // A professional blue
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f4f6f8', // A very light grey for the background
      paper: '#ffffff',   // White for cards and surfaces
    },
    text: {
      primary: '#333333',
      secondary: '#555555',
    }
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
    h2: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 400,
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Softer corners
        }
      }
    }
  }
});

export default theme;