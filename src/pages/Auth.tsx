
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Chrome } from "lucide-react";
import ForgotPasswordDialog from "@/components/ForgotPasswordDialog";

const Auth = () => {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleSigninEnabled, setGoogleSigninEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchGoogleSigninSetting();
  }, []);

  const fetchGoogleSigninSetting = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'google_signin_enabled')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching Google signin setting:', error);
        // Default to false on error to be safe
        setGoogleSigninEnabled(false);
      } else if (data) {
        setGoogleSigninEnabled(data.value === true);
      } else {
        // Default to false if setting doesn't exist
        setGoogleSigninEnabled(false);
      }
    } catch (error: any) {
      console.error('Error fetching Google signin setting:', error);
      // Default to false on error
      setGoogleSigninEnabled(false);
    } finally {
      setSettingsLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          Loading...
        </div>
      </div>
    );
  }

  const handleEmailSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    if (error) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleEmailSignUp = async () => {
    setLoading(true);
    const { error } = await signUpWithEmail(email, password);
    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Check your email for verification link",
      });
    }
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">SS</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Seva Sarthi Connect
          </CardTitle>
          <CardDescription>
            Connect and serve with your spiritual community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {googleSigninEnabled && (
            <>
              <Button
                onClick={signInWithGoogle}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                <Chrome className="w-4 h-4 mr-2" />
                Continue with Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
            </>
          )}

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleEmailSignIn)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleEmailSignIn)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button
                onClick={handleEmailSignIn}
                className="w-full"
                disabled={loading}
              >
                Sign In
              </Button>
              <div className="text-center">
                <ForgotPasswordDialog />
              </div>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleEmailSignUp)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleEmailSignUp)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button
                onClick={handleEmailSignUp}
                className="w-full"
                disabled={loading}
              >
                Sign Up
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
