import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  LogIn, 
  Mail, 
  Lock, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDemoUser = async () => {
    try {
      setIsLoading(true);
      console.log("Creating demo user...");
      
      // First try to sign up the demo user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'admin@example.com',
        password: 'password123',
        options: {
          data: {
            role: 'admin'
          }
        }
      });

      if (signUpError && !signUpError.message.includes('User already registered')) {
        console.error("Sign up error:", signUpError);
        throw signUpError;
      }

      console.log("Sign up response:", signUpData);

      // If signup was successful or user already exists, try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@example.com',
        password: 'password123'
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        throw signInError;
      }

      console.log("Sign in response:", signInData);

      // Also create an admin user record if it doesn't exist
      if (signInData.user) {
        const { error: adminError } = await supabase
          .from('admin_users')
          .upsert({
            id: signInData.user.id,
            email: 'admin@example.com',
            name: 'Demo Admin',
            role: 'admin',
            active: true
          }, {
            onConflict: 'id'
          });

        if (adminError) {
          console.warn('Could not create admin user record:', adminError);
        }
      }

      return signInData;
    } catch (error) {
      console.error("Demo user creation error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log("Attempting login with:", { email });
      
      // First attempt normal login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Login error:", error);
        
        // If it's the demo credentials and login failed, try to create the demo user
        if (email === 'admin@example.com' && password === 'password123' && 
            error.message.includes('Invalid login credentials')) {
          
          console.log("Attempting to create demo user...");
          const demoData = await createDemoUser();
          if (demoData.user) {
            toast.success('Demo account created and logged in!');
            navigate('/');
            return;
          }
        }
        throw error;
      }

      console.log("Login successful:", data);

      if (data.user) {
        toast.success('Login successful!');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Failed to sign in';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Attempting demo login...");
      const data = await createDemoUser();
      
      if (data.user) {
        toast.success('Demo login successful!');
        // Update the form fields to show demo credentials
        setEmail('admin@example.com');
        setPassword('password123');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Demo login error:', error);
      const errorMessage = error.message || 'Failed to sign in with demo account';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-xl">LPG</span>
          </div>
          <h1 className="text-3xl font-bold">LPG Order Management</h1>
          <p className="text-muted-foreground mt-2">Sign in to access your dashboard</p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign In
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-destructive">{error}</div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  variant="outline" 
                  className="w-full bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                >
                  Demo Account (Instant Access)
                </Button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-xs text-blue-700">
                <strong>Demo Credentials:</strong><br />
                Email: admin@example.com<br />
                Password: password123
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-xs text-muted-foreground text-center">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}