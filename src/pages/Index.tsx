
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";
import { Navigate, Link } from "react-router-dom";
import { Users, Calendar, MessageSquare, FileText, Heart, Star } from "lucide-react";

const Index = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">SS</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Seva Sarthi Connect</h1>
            </div>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Connect. Serve. Grow.
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join our spiritual community management platform designed to bring together 
            karyakars, manage seva activities, and strengthen our spiritual bonds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Community
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools designed specifically for spiritual community management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <CardTitle>Karyakar Management</CardTitle>
                <CardDescription>
                  Maintain detailed profiles of all community members
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Calendar className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <CardTitle>Task Management</CardTitle>
                <CardDescription>
                  Assign and track seva activities efficiently
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <CardTitle>Communication</CardTitle>
                <CardDescription>
                  Stay connected with messaging and updates
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <FileText className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <CardTitle>Reports & Analytics</CardTitle>
                <CardDescription>
                  Generate insights and track community growth
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-r from-orange-100 to-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Built with Spiritual Values
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform is designed to honor and strengthen the spiritual bonds that unite us
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Heart className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Seva</h4>
              <p className="text-gray-600">
                Facilitating selfless service to the community and spiritual growth
              </p>
            </div>

            <div className="text-center">
              <Star className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Unity</h4>
              <p className="text-gray-600">
                Bringing together karyakars from all levels in harmonious collaboration
              </p>
            </div>

            <div className="text-center">
              <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Community</h4>
              <p className="text-gray-600">
                Strengthening bonds and fostering spiritual development together
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-amber-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Join Our Community?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Start your journey of seva and spiritual growth with us today
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/auth">Join Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">SS</span>
              </div>
              <h4 className="text-xl font-bold">Seva Sarthi Connect</h4>
            </div>
            <p className="text-gray-400 mb-4">
              Connecting hearts, serving together, growing spiritually
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 Seva Sarthi Connect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
