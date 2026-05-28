"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { userService } from "@/lib/services/userService";
import { tripApiService } from "@/lib/services/tripApiService";
import { chatService } from "@/lib/services/chatService";
import { userSessionService } from "@/lib/services/userSessionService";
import { useToast } from "@/components/feedback/toast-provider";
import { Modal } from "@/components/common/modal";
import { formatCurrencyRs } from "@/lib/utils";
import { 
  MapPin, 
  CalendarDays, 
  Star, 
  CheckCircle2, 
  MessageSquare, 
  Compass, 
  ShieldCheck, 
  ArrowLeft,
  Clock,
  Sparkles,
  Globe,
  StarOff,
  UserCheck,
  Award,
  Languages,
  Activity,
  Calendar,
  Users,
  Check,
  Share2,
  Image as ImageIcon,
  Facebook,
  Instagram,
  Twitter,
  Linkedin
} from "lucide-react";

export default function OrganizerProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [ownTrips, setOwnTrips] = useState<any[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const { pushToast } = useToast();

  const handleRequestCustomTrip = async () => {
    if (!currentUser) {
      pushToast({
        title: "Authentication Required",
        description: "Please sign in to request a custom trip.",
        type: "error",
      });
      router.push(`/login?redirect=/organizers/${id}`);
      return;
    }

    const tokenVal = userSessionService.getToken();
    if (!tokenVal) {
      pushToast({
        title: "Authentication Required",
        description: "Please sign in to request a custom trip.",
        type: "error",
      });
      router.push(`/login?redirect=/organizers/${id}`);
      return;
    }

    try {
      setSendingRequest(true);
      const travelerName = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || "Traveler";
      const response = await chatService.requestCustomTrip({
        guideId: id as string,
        travelerId: currentUser.id,
        travelerName: travelerName,
      }, tokenVal);

      if (response.data) {
        pushToast({
          title: "Request Sent Successfully",
          description: "Opening custom trip chat group...",
          type: "success",
        });
        router.push(`/chat?tripId=${response.data.tripId}`);
      } else {
        throw new Error(response.message || "Failed to submit request.");
      }
    } catch (err: any) {
      pushToast({
        title: "Request Failed",
        description: err?.message || "Could not send request. Please try again.",
        type: "error",
      });
    } finally {
      setSendingRequest(false);
    }
  };

  useEffect(() => {
    setCurrentUser(userSessionService.getUserProfile<any>());
  }, []);

  useEffect(() => {
    const loadOwnTrips = async () => {
      if (!currentUser?.id || currentUser.id !== id) {
        setOwnTrips([]);
        return;
      }

      const token = userSessionService.getToken();
      if (!token) {
        setOwnTrips([]);
        return;
      }

      try {
        const response = await tripApiService.getMyTrips(token);
        setOwnTrips(response.data || []);
      } catch {
        setOwnTrips([]);
      }
    };

    loadOwnTrips();
  }, [currentUser, id]);

  const handleMessageOrganizer = async () => {
    if (!currentUser) {
      pushToast({
        title: "Authentication Required",
        description: "Please sign in to message this organizer.",
        type: "error",
      });
      router.push(`/login?redirect=/organizers/${id}`);
      return;
    }

    const token = userSessionService.getToken();
    if (!token) {
      pushToast({
        title: "Authentication Required",
        description: "Please sign in to message this organizer.",
        type: "error",
      });
      router.push(`/login?redirect=/organizers/${id}`);
      return;
    }

    try {
      setCreatingChat(true);
      const travelerId = currentUser.id;
      const guideId = id as string;

      const sortedIds = [travelerId, guideId].sort();
      const dmTripId = `dm-${sortedIds[0]}-${sortedIds[1]}`;

      const travelerName = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || "Traveler";
      const guideNameVal = organizerName;
      const dmName = `${travelerName} | ${guideNameVal}`;

      const response = await chatService.createChatGroup({
        tripId: dmTripId,
        name: dmName,
        adminId: travelerId,
        adminName: travelerName,
        description: `Direct message group between ${travelerName} and ${guideNameVal}`,
        members: [travelerId, guideId],
      }, token);

      if (response.data) {
        pushToast({
          title: "Chat Initialized",
          description: `Opening conversation with ${guideNameVal}...`,
          type: "success",
        });
        router.push(`/chat?tripId=${dmTripId}`);
      } else {
        throw new Error(response.message || "Could not start chat");
      }
    } catch (err: any) {
      pushToast({
        title: "Error Starting Chat",
        description: err?.message || "Failed to start direct message. Please try again.",
        type: "error",
      });
    } finally {
      setCreatingChat(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError("");
        const response = await userService.getOrganizerProfile(id);
        if (!response.data) {
          setError("Profile not found.");
        } else {
          setProfile(response.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load organizer profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  // Compute stats and display values
  const organizerName = useMemo(() => {
    if (!profile?.organizer) return "Local Guide";
    const first = profile.organizer.firstName || "";
    const last = profile.organizer.lastName || "";
    return `${first} ${last}`.trim() || "Local Guide";
  }, [profile]);

  const initials = useMemo(() => {
    if (!profile?.organizer) return "LG";
    const first = profile.organizer.firstName?.[0] || "";
    const last = profile.organizer.lastName?.[0] || "";
    return (first + last).toUpperCase() || "LG";
  }, [profile]);

  const joinedDate = useMemo(() => {
    if (!profile?.organizer?.createdAt) return "Joined recently";
    const date = new Date(profile.organizer.createdAt);
    if (Number.isNaN(date.getTime())) return "Joined recently";
    return `Joined ${date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  }, [profile]);

  const todayStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const displayTrips = useMemo(() => {
    const publicTrips = profile?.trips || [];

    if (!(currentUser?.id && currentUser.id === id && ownTrips.length > 0)) {
      return publicTrips;
    }

    const mergedById = new Map<string, any>();

    ownTrips.forEach((trip) => {
      if (trip?.id) {
        mergedById.set(trip.id, trip);
      }
    });

    publicTrips.forEach((trip) => {
      if (!trip?.id) {
        return;
      }

      const existingTrip = mergedById.get(trip.id);
      mergedById.set(trip.id, existingTrip ? { ...existingTrip, ...trip, reviews: trip.reviews ?? existingTrip.reviews } : trip);
    });

    return Array.from(mergedById.values());
  }, [currentUser?.id, id, ownTrips, profile?.trips]);

  const upcomingTrips = useMemo(() => {
    return displayTrips
      .filter((trip) => {
        const startDate = trip.startDate ? new Date(trip.startDate) : null;
        const status = String(trip.status || "").toLowerCase();
        const tripCategory = String(trip.tripCategory || "").toLowerCase();
        const bookedCount = (trip.participants || []).length;
        const maxParticipants = Number(trip.maxParticipants || 0);

        if (!startDate || Number.isNaN(startDate.getTime())) return false;
        if (tripCategory === "private trip") return false;
        if (["draft", "pending", "in review", "rejected", "cancelled"].includes(status)) return false;
        if (startDate < todayStart) return false;
        if (maxParticipants > 0 && bookedCount >= maxParticipants) return false;

        return true;
      })
      .sort((left, right) => {
        const leftDate = left.startDate ? new Date(left.startDate).getTime() : 0;
        const rightDate = right.startDate ? new Date(right.startDate).getTime() : 0;
        return leftDate - rightDate;
      });
  }, [displayTrips, todayStart]);

  const finishedTrips = useMemo(() => {
    return displayTrips
      .filter((trip) => {
        const endDate = trip.endDate ? new Date(trip.endDate) : null;
        const status = String(trip.status || "").toLowerCase();

        if (!endDate || Number.isNaN(endDate.getTime())) return false;
        if (["draft", "pending", "in review", "rejected", "cancelled"].includes(status)) return false;

        return endDate < todayStart;
      })
      .sort((left, right) => {
        const leftDate = left.endDate ? new Date(left.endDate).getTime() : 0;
        const rightDate = right.endDate ? new Date(right.endDate).getTime() : 0;
        return rightDate - leftDate;
      });
  }, [displayTrips, todayStart]);

  const visibleTripsCount = displayTrips.length;

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-12 md:px-6 space-y-8">
          {/* Skeleton Hero & Header Profile */}
          <div className="h-[200px] w-full rounded-2xl bg-muted animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-[400px] rounded-2xl bg-muted animate-pulse" />
            </div>
            <div className="lg:col-span-3 space-y-6">
              <div className="h-[50px] w-[300px] rounded-lg bg-muted animate-pulse" />
              <div className="space-y-4">
                <div className="h-[120px] rounded-xl bg-muted animate-pulse" />
                <div className="h-[120px] rounded-xl bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-20 flex items-center justify-center">
          <EmptyState
            title="Profile Unavailable"
            description={error || "The requested organizer profile could not be loaded."}
            action={
              <Button onClick={() => router.push("/trips")} variant="outline" className="gap-2">
                <ArrowLeft className="size-4" /> Back to departures
              </Button>
            }
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 w-full pb-24">
        
        {/* Banner with Sri Lanka Landscape Overlay */}
        <section className="relative h-[220px] md:h-[280px] w-full overflow-hidden bg-zinc-950">
          <div className="absolute inset-0">
            <img 
              src={profile.organizer.coverImage || "https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=1600&auto=format&fit=crop"} 
              alt={`${organizerName} Cover Banner`} 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-linear-to-t from-background via-black/30 to-black/60" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 h-full flex items-end pb-6">
            <Button 
              onClick={() => router.push("/trips")} 
              variant="secondary" 
              size="sm" 
              className="bg-black/50 text-white backdrop-blur-md hover:bg-black/70 border border-white/10 rounded-full font-bold cursor-pointer"
            >
              <ArrowLeft className="size-4 mr-1.5" /> Back to Departures
            </Button>
          </div>
        </section>

        {/* Main Content: Spacious Full-Width Organizer Card at the Top */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-6 -mt-16 space-y-8">
          
          <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-10 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Profile Main Visual & Stats (lg:col-span-4) */}
              <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
                <div className="relative">
                  {profile.organizer.profileImage ? (
                    <img 
                      src={profile.organizer.profileImage} 
                      alt={organizerName} 
                      className="size-32 md:size-36 rounded-full object-cover border-4 border-background shadow-lg"
                    />
                  ) : (
                    <div className="size-32 md:size-36 rounded-full bg-linear-to-tr from-sky-500 to-indigo-600 flex items-center justify-center border-4 border-background shadow-lg text-white font-extrabold text-4xl">
                      {initials}
                    </div>
                  )}

                  {profile.organizer.isVerified && (
                    <div className="absolute bottom-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-1.5 border-2 border-background shadow-xs" title="Verified Host Guide">
                      <ShieldCheck className="size-5.5 fill-emerald-500 stroke-white" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-2xl md:text-3xl font-black text-foreground flex items-center justify-center lg:justify-start gap-1.5">
                    {organizerName}
                  </h1>
                  <div className="flex items-center justify-center lg:justify-start gap-1.5 text-xs text-muted-foreground font-semibold">
                    <MapPin className="size-3.5 text-primary/70 shrink-0" />
                    <span>{profile.organizer.city ? `${profile.organizer.city}, ${profile.organizer.country || "Sri Lanka"}` : "Sri Lanka"}</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-1.5 text-xs text-muted-foreground font-medium">
                    <CalendarDays className="size-3.5 text-muted-foreground/80 shrink-0" />
                    <span>{joinedDate}</span>
                  </div>
                  
                  {(profile.organizer.socialLinks || profile.organizer.website) && (
                    <div className="flex items-center justify-center lg:justify-start gap-3 pt-1.5">
                      {profile.organizer.website && (
                        <a href={profile.organizer.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-bold text-xs" title="Website">
                          <Globe className="size-5 text-emerald-500" />
                          <span className="sr-only">Website</span>
                        </a>
                      )}
                      {profile.organizer.socialLinks?.facebook && (
                        <a href={profile.organizer.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-600 transition-colors" title="Facebook">
                          <Facebook className="size-5" />
                        </a>
                      )}
                      {profile.organizer.socialLinks?.instagram && (
                        <a href={profile.organizer.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-pink-500 transition-colors" title="Instagram">
                          <Instagram className="size-5" />
                        </a>
                      )}
                      {profile.organizer.socialLinks?.twitter && (
                        <a href={profile.organizer.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-sky-500 transition-colors" title="Twitter / X">
                          <Twitter className="size-5" />
                        </a>
                      )}
                      {profile.organizer.socialLinks?.linkedin && (
                        <a href={profile.organizer.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-700 transition-colors" title="LinkedIn">
                          <Linkedin className="size-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-full max-w-sm space-y-2.5 mt-1">
                  {(!currentUser || currentUser.id !== id) && (
                    <>
                      <Button
                        onClick={handleMessageOrganizer}
                        disabled={creatingChat}
                        className="w-full gap-2 font-bold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <MessageSquare className="size-4" />
                        {creatingChat ? "Starting Chat..." : "Message Guide"}
                      </Button>
                      <Button
                        onClick={handleRequestCustomTrip}
                        variant="outline"
                        className="w-full gap-2 font-bold cursor-pointer border-primary text-primary hover:bg-primary/5"
                      >
                        <Sparkles className="size-4" />
                        Request Custom Trips
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => {
                      const link = window.location.href;
                      navigator.clipboard.writeText(link);
                      pushToast({
                        title: "Profile Shared",
                        description: "Public profile link copied to clipboard.",
                        type: "success",
                      });
                    }}
                    variant="outline"
                    className="w-full gap-2 font-bold cursor-pointer"
                  >
                    <Share2 className="size-4" />
                    Share Profile / Copy Link
                  </Button>
                </div>

                {/* High Impact Statistics Summary */}
                <div className="grid grid-cols-3 gap-3 text-center w-full max-w-sm">
                  <div className="bg-muted/40 border border-border/40 p-3 rounded-xl">
                    <span className="text-xl font-black text-foreground block">
                      {profile.overallRating || "New"}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Rating
                    </span>
                  </div>
                  <div className="bg-muted/40 border border-border/40 p-3 rounded-xl">
                    <span className="text-xl font-black text-foreground block">
                      {profile.totalReviews || "0"}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Reviews
                    </span>
                  </div>
                  <div className="bg-muted/40 border border-border/40 p-3 rounded-xl">
                    <span className="text-xl font-black text-foreground block">
                      {visibleTripsCount || "0"}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Trips
                    </span>
                  </div>
                </div>
              </div>

              {/* Organizer Description & Bio & Credentials (lg:col-span-8) */}
              <div className="lg:col-span-8 space-y-6 lg:border-l lg:border-border/60 lg:pl-8">
                
                {/* About the Host */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <UserCheck className="size-4 text-primary/70" /> About the Host
                  </h3>
                  <p className="text-base text-foreground/80 leading-relaxed font-medium">
                    {profile.organizer.bio || `\"Hi, I'm ${profile.organizer.firstName || "your host"}. I plan custom and guided journeys across Sri Lanka, focusing on local encounters, safety, and authentic hospitality.\"`}
                  </p>
                </div>

                <hr className="border-border/60" />

                {/* Credentials & Details Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Award className="size-4 text-primary/70" /> Guide Information
                    </h3>
                    
                    <div className="space-y-3.5">
                      <div className="flex items-start gap-3">
                        <Languages className="size-4.5 text-primary shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <span className="font-bold text-foreground block">Languages Spoken</span>
                          <span className="text-muted-foreground font-medium">
                            {profile.organizer.languagesSpoken && profile.organizer.languagesSpoken.length > 0
                              ? profile.organizer.languagesSpoken.join(", ")
                              : "English, Sinhala, Tamil"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Activity className="size-4.5 text-primary shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <span className="font-bold text-foreground block">Specializations</span>
                          <span className="text-muted-foreground font-medium">
                            {profile.organizer.specializations && profile.organizer.specializations.length > 0
                              ? profile.organizer.specializations.join(", ")
                              : "Cultural Heritage, Family Expeditions, Solo Safe Anchors"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="size-4.5 text-primary shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <span className="font-bold text-foreground block">Identity Verified</span>
                          <span className="text-muted-foreground font-medium">Government ID & credentials checks completed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trust Indicators */}
                  <div className="flex flex-col justify-center bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-xl space-y-3 text-xs text-emerald-800 font-medium h-fit self-center">
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="size-4.5 text-emerald-500 shrink-0" />
                      <span>Licensed Guide Practitioner</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="size-4.5 text-emerald-500 shrink-0" />
                      <span>100% Secure Escrow Deposit Guarantee</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Past Trips Photos Gallery Section */}
          {profile.organizer.tripPhotos && profile.organizer.tripPhotos.length > 0 && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <ImageIcon className="size-5 text-primary" />
                  Past Organized Trips Gallery
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {profile.organizer.tripPhotos.map((photoUrl: string, idx: number) => (
                  <div 
                    key={idx} 
                    onClick={() => setLightboxImage(photoUrl)}
                    className="relative aspect-video rounded-xl overflow-hidden border border-border bg-muted shadow-sm hover:shadow-md transition-all duration-300 group cursor-zoom-in"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={photoUrl} 
                      alt={`Trip Photo ${idx + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-white text-xs font-bold px-3 py-1 rounded-full bg-black/50 backdrop-blur-xs">View Image</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Upcoming Trips */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Compass className="size-5 text-primary" />
              Upcoming trips ({upcomingTrips.length})
            </h2>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Buyable public departures
            </span>
          </div>

          {upcomingTrips.length === 0 ? (
            <EmptyState title="No Upcoming Trips" description="There are no public trips available for booking right now." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {upcomingTrips.map((trip: any) => {
                const firstDest = trip.destinations?.[0]?.name ?? trip.startLocation ?? "";
                const start = trip.startDate ? new Date(trip.startDate) : null;
                const end = trip.endDate ? new Date(trip.endDate) : null;
                const durationDays = start && end ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1;
                const bookedCount = (trip.participants || []).length;
                const maxParticipants = trip.maxParticipants || 15;
                const seatsLeft = Math.max(0, maxParticipants - bookedCount);
                const tripRating = trip.averageRating || null;
                const reviewsCount = trip.reviewCount || 0;

                return (
                  <div key={trip.id} className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md hover:shadow-lg transition-shadow">
                    <div className="relative aspect-4/3 bg-muted">
                      {trip.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={trip.coverImage} alt={trip.tripName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-sky-500/20 to-indigo-600/20 text-primary">
                          <ImageIcon className="size-10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
                      <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-3 text-white">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/75">Public trip</p>
                          <h3 className="mt-1 line-clamp-2 text-lg font-black leading-tight">{trip.tripName}</h3>
                        </div>
                        <div className="rounded-full bg-black/45 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                          {formatCurrencyRs(trip.price)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary/80">
                          <MapPin className="size-3" />
                          <span>{firstDest}, Sri Lanka</span>
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground font-medium">{trip.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-muted-foreground">
                        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-muted-foreground/80" />
                            <span>{trip.startDate}</span>
                          </div>
                          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground/70">{durationDays} days</p>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                          <div className="flex items-center gap-1.5">
                            <Users className="size-3.5 text-muted-foreground/80" />
                            <span>{seatsLeft} seats left</span>
                          </div>
                          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground/70">{bookedCount}/{maxParticipants} booked</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {tripRating ? (
                          <div className="flex items-center gap-1 rounded-full border border-amber-500/10 bg-amber-500/5 px-2.5 py-1 font-bold text-amber-600">
                            <Star className="size-3 fill-amber-500 text-amber-500" />
                            <span>{tripRating}</span>
                            <span className="text-[10px] text-muted-foreground font-medium">({reviewsCount})</span>
                          </div>
                        ) : (
                          <span className="rounded-full border border-border/50 bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            New trip
                          </span>
                        )}
                        <span className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                          Buy now
                        </span>
                      </div>

                      <Button asChild className="w-full font-bold cursor-pointer">
                        <Link href={`/trips/${trip.id}`}>View and buy</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Finished Trips */}
        <div className="space-y-6 mt-10">
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" />
              Finished trips & feedbacks ({finishedTrips.length})
            </h2>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Includes private trips when available
            </span>
          </div>

          <div className="min-h-[400px]">
            {finishedTrips.length === 0 ? (
              <EmptyState
                title="No Finished Trips"
                description="Finished trips and their feedback will appear here once trips are completed."
              />
            ) : (
              <div className="flex flex-col divide-y divide-border/60 bg-card border border-border/80 rounded-2xl p-6 shadow-md">
                {finishedTrips.map((trip: any, idx: number) => {
                  const firstDest = trip.destinations?.[0]?.name ?? trip.startLocation ?? "";
                  const start = trip.startDate ? new Date(trip.startDate) : null;
                  const end = trip.endDate ? new Date(trip.endDate) : null;
                  const durationDays = start && end ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1;
                  const tripRating = trip.averageRating || null;
                  const reviewsCount = trip.reviewCount || 0;
                  const categoryLabel = String(trip.tripCategory || "Public trip");

                  return (
                    <div
                      key={trip.id}
                      className={`flex flex-col py-6 ${idx === 0 ? "pt-0" : ""} ${idx === finishedTrips.length - 1 ? "pb-0" : ""}`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-primary/80 uppercase tracking-wider">
                            <MapPin className="size-3" />
                            <span>{firstDest}, Sri Lanka</span>
                            <span className="rounded-full border border-border/60 bg-muted px-2 py-0.5 text-[9px] font-semibold tracking-wider text-muted-foreground">
                              {categoryLabel}
                            </span>
                          </div>
                          <Link
                            href={`/trips/${trip.id}`}
                            className="font-bold text-base text-foreground hover:text-primary transition-colors block"
                          >
                            {trip.tripName}
                          </Link>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-xl font-medium">{trip.description}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:justify-end text-xs font-semibold text-muted-foreground shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-muted-foreground/80" />
                            <span>
                              {trip.startDate} ({durationDays}d)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="size-3.5 text-muted-foreground/80" />
                            <span>{(trip.participants || []).length}/{trip.maxParticipants || 15} Booked</span>
                          </div>

                          {tripRating ? (
                            <div className="flex items-center gap-1 rounded-md border border-amber-500/10 bg-amber-500/5 px-2 py-0.5 text-amber-600" title="Real trip review rating">
                              <Star className="size-3 fill-amber-500 text-amber-500" />
                              <span className="font-extrabold">{tripRating}</span>
                              <span className="text-[10px] font-medium text-muted-foreground">({reviewsCount})</span>
                            </div>
                          ) : (
                            <span className="rounded-md border border-border/40 bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              No rating yet
                            </span>
                          )}

                          <div className="flex items-center gap-4 lg:pl-4">
                            <span className="font-extrabold text-foreground text-sm">{formatCurrencyRs(trip.price)}</span>
                          </div>
                        </div>
                      </div>

                      {trip.reviews && trip.reviews.length > 0 && (
                        <div className="mt-4 pl-5 border-l-2 border-primary/20 space-y-3">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <MessageSquare className="size-3.5" />
                            <span>Participant Feedbacks ({trip.reviews.length})</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {trip.reviews.map((review: any) => {
                              const reviewerName = review.userName || "Participant";
                              const reviewerInitials = reviewerName
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase() || "P";

                              return (
                                <div key={review.id} className="bg-muted/30 border border-border/50 p-3.5 rounded-xl space-y-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="size-6 rounded-full bg-secondary flex items-center justify-center font-bold text-[10px] text-secondary-foreground">
                                        {reviewerInitials}
                                      </div>
                                      <div>
                                        <span className="font-bold text-foreground block">{reviewerName}</span>
                                        <div className="flex items-center gap-0.5">
                                          {[...Array(5)].map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`size-2.5 ${
                                                i < review.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <span className="text-[9px] font-semibold text-muted-foreground">
                                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                                    </span>
                                  </div>
                                  <p className="leading-relaxed italic text-foreground/80">"{review.comment}"</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        </div>

      </main>

      {/* Lightbox Overlay */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold z-50 cursor-pointer"
          >
            &times;
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={lightboxImage} 
            alt="Enlarged gallery view" 
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}

      <Footer />
    </div>
  );
}
