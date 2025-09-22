"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Plus, Settings, LogOut, MoreVertical, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  status: "ACTIVE" | "ENDED" | "CANCELLED"
  slug: string
  _count: {
    registrations: number
  }
}

export default function DashboardPage() {
  const { user, logout, loading } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalRegistrations: 0,
  })
  const [mounted, setMounted] = useState(false) // 🔑 for safe client-only rendering
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchEvents()
      fetchStats()
    }
  }, [user])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    } finally {
      setEventsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/events/stats", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        setEvents(events.filter((event) => event.id !== eventId))
        fetchStats() // Refresh stats
      }
    } catch (error) {
      console.error("Failed to delete event:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "ENDED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Redirect handled in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">Eventify</span>
            </Link>
            <div className="hidden md:block">
              <Badge variant="secondary">Dashboard</Badge>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user && <span className="hidden sm:block text-sm text-muted-foreground">Welcome, {user.name}</span>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">All time events created</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.activeEvents}</div>
              <p className="text-xs text-muted-foreground">Currently accepting registrations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.totalRegistrations}</div>
              <p className="text-xs text-muted-foreground">Across all events</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link href="/dashboard/events/create">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create New Event
            </Button>
          </Link>
        </div>

        {/* Events List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Your Events</h2>
          </div>

          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No events yet</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Create your first event to start managing registrations and engaging with attendees.
                </p>
                <Link href="/dashboard/events/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Event
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 text-balance">{event.title}</CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {event._count.registrations}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/events/${event.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Event
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/events/${event.id}`}>
                              <Users className="h-4 w-4 mr-2" />
                              View Registrations
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4 text-pretty">{event.description}</CardDescription>
                    {mounted && (
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {format(new Date(event.date), "PPP")} at {event.time}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {event.location}
                        </div>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-border">
                      <Link href={`/events/${event.slug}`}>
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          View Public Page
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
