
import { useAuth } from "@/components/AuthProvider";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckSquare, MessageSquare, Shield, Building2, Heart } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      icon: Users,
      title: "Karyakar Management",
      description: "Manage spiritual community members with role-based access and hierarchical organization."
    },
    {
      icon: CheckSquare,
      title: "Task Coordination",
      description: "Assign, track, and manage seva tasks across different levels of the organization."
    },
    {
      icon: MessageSquare,
      title: "Spiritual Communication",
      description: "Connect and communicate with fellow devotees through secure, organized channels."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Enterprise-grade security with role-based permissions and data protection."
    },
    {
      icon: Building2,
      title: "Hierarchical Structure",
      description: "Organize your spiritual community from Mandirs to Mandals with clear structure."
    },
    {
      icon: Heart,
      title: "Seva-Focused",
      description: "Built specifically for spiritual organizations to enhance seva and devotion."
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">SS</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight">
            Seva Sarthi <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Connect</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering spiritual communities through organized seva, seamless communication, 
            and meaningful connections. Unite your karyakars and sevaks in divine service.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-3 text-lg"
              onClick={() => window.location.href = '/auth'}
            >
              Begin Your Seva Journey
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-orange-300 text-orange-700 hover:bg-orange-50 px-8 py-3 text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-orange-100 hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-2xl p-12 shadow-xl border border-orange-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Spiritual Community?
          </h2>
          <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
            Join thousands of spiritual organizations already using Seva Sarthi Connect 
            to organize their communities and enhance their seva.
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-12 py-4 text-lg"
            onClick={() => window.location.href = '/auth'}
          >
            Start Your Free Journey
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-orange-100 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SS</span>
            </div>
            <span className="font-bold text-gray-900">Seva Sarthi Connect</span>
          </div>
          <p className="text-gray-600">
            Connecting hearts, organizing seva, building spiritual communities.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
