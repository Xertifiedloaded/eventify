import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, QrCode, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Eventify</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-5xl font-bold text-foreground mb-6 text-balance">
            Create and Manage Events with Professional Ease
          </h2>
          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            Eventify empowers organizers to create, manage, and track events seamlessly. From registration to QR code
            verification, everything you need in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-8">
                Start Creating Events
              </Button>
            </Link>
            <Link href="/events">
              <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                Browse Events
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center text-foreground mb-12">Everything You Need to Manage Events</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Calendar className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Easy Event Creation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create events in minutes with our intuitive interface. Set dates, descriptions, and manage everything
                  from one dashboard.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Simple Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Attendees can register without creating accounts. Just name, email, and location - that's it.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <QrCode className="h-12 w-12 text-primary mb-4" />
                <CardTitle>QR Code Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automatic QR code generation for each registration. Scan to verify attendees at your event.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Secure & Professional</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Built with security in mind. Professional tools for serious event organizers.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">© 2024 Eventify. Built with Next.js and modern web technologies.</p>
        </div>
      </footer>
    </div>
  )
}
