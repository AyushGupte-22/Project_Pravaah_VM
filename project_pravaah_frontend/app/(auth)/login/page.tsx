// app/(auth)/login/page.tsx
"use client";
import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useRouter } from 'next/navigation';
import { 
  Container, Box, Typography, TextField, Button, 
  Alert, Paper, SvgIcon, SvgIconProps, Grid, Link,
  Collapse // Import Collapse for the success message
} from '@mui/material';

// Your Project Icon
const RocketIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.41 13.41L14 14l-1.41 1.41L11.17 14 9.76 15.41 8.34 14l-1.41 1.41L4 12.5l2.94-2.91L8.34 11l1.41-1.41L11.17 11l1.41-1.41L14 11l1.59-1.59L18.5 12.5l-3.09 2.91zM9.5 8C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5 11 5.67 11 6.5 10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5 16 5.67 16 6.5 15.33 8 14.5 8z"/>
  </SvgIcon>
);

export default function LoginPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // New state for success message
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isLoginView) {
      // --- LOGIN LOGIC ---
      try {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/'); // Redirect to the main upload page
      } catch (err) {
        setError("Failed to log in. Please check your email and password.");
      }
    } else {
      // --- SIGN UP LOGIC ---
      if (name === '') {
        setError("Please enter your full name.");
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        // --- NEW SIGN UP FLOW ---
        await auth.signOut(); // Log them out
        setSuccess("Account created! Please sign in to continue.");
        setIsLoginView(true); // Switch to login view
        // Clear fields
        setName('');
        setEmail('');
        setPassword('');

      } catch (err: unknown) { // <-- Fix for 'err' is defined but never used
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to create an account. Password must be at least 6 characters.");
        }
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', borderRadius: 2 }}>
        <RocketIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
        <Typography component="h1" variant="h5">
          {isLoginView ? 'Welcome Back' : 'Create Your Account'}
        </Typography>
        
        {/* --- NEW: Success Message --- */}
        <Collapse in={success !== ''}>
          <Alert severity="success" sx={{ width: '100%', mt: 2 }}>
            {success}
          </Alert>
        </Collapse>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          
          {!isLoginView && (
            <TextField
              margin="normal"
              required
              fullWidth
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }}
          >
            {isLoginView ? 'Sign In' : 'Create Account'}
          </Button>
          
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link href="#" variant="body2" onClick={() => {
                setIsLoginView(!isLoginView);
                setError('');
                setSuccess('');
              }} sx={{ cursor: 'pointer' }}>
                {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}