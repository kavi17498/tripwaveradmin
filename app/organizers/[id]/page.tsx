"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { userService } from "@/lib/services/userService";
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
  Check
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
              src="https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=1600&auto=format&fit=crop" 
              alt="Ella Rock Sri Lanka Banner" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-black/30 to-black/60" />
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
                </div>

                {(!currentUser || currentUser.id !== id) && (
                  <div className="w-full max-w-sm space-y-2.5 mt-1">
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
                  </div>
                )}

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
                      {profile.trips?.length || "0"}
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
                          <span className="text-muted-foreground font-medium">English, Sinhala, Tamil</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Activity className="size-4.5 text-primary shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <span className="font-bold text-foreground block">Specializations</span>
                          <span className="text-muted-foreground font-medium">Cultural Heritage, Family Expeditions, Solo Safe Anchors</span>
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

          {/* Bottom section: Feed Content */}
          <div className="space-y-6">
            
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Compass className="size-5 text-primary" />
                Active departures ({profile.trips?.length || 0})
              </h2>
            </div>

            {/* List Container */}
            <div className="min-h-[400px]">
              {profile.trips?.length === 0 ? (
                <EmptyState
                  title="No Departures Available"
                  description="This guide does not have any active public departures scheduled at the moment."
                />
              ) : (
                <div className="flex flex-col divide-y divide-border/60 bg-card border border-border/80 rounded-2xl p-6 shadow-md">
                  {profile.trips.map((trip: any, idx: number) => {
                    const firstDest = trip.destinations?.[0]?.name ?? trip.startLocation ?? "";
                    
                    const start = trip.startDate ? new Date(trip.startDate) : null;
                    const end = trip.endDate ? new Date(trip.endDate) : null;
                    const durationDays = start && end ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1;

                    const tripRating = trip.averageRating || null;
                    const reviewsCount = trip.reviewCount || 0;

                    return (
                      <div 
                        key={trip.id} 
                        className={`flex flex-col py-6 ${idx === 0 ? "pt-0" : ""} ${idx === profile.trips.length - 1 ? "pb-0" : ""}`}
                      >
                        {/* Trip Row Main Info */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Left details: Destination and Trip Name */}
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary/80 uppercase tracking-wider">
                              <MapPin className="size-3" />
                              <span>{firstDest}, Sri Lanka</span>
                            </div>
                            <Link 
                              href={`/trips/${trip.id}`}
                              className="font-bold text-base text-foreground hover:text-primary transition-colors block"
                            >
                              {trip.tripName}
                            </Link>
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-xl font-medium">
                              {trip.description}
                            </p>
                          </div>

                          {/* Right details: Date, Booked stats, Rating, Price & Button */}
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:justify-end text-xs font-semibold text-muted-foreground shrink-0">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="size-3.5 text-muted-foreground/80" />
                              <span>{trip.startDate} ({durationDays}d)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="size-3.5 text-muted-foreground/80" />
                              <span>{(trip.participants || []).length}/{trip.maxParticipants || 15} Booked</span>
                            </div>
                            
                            {tripRating ? (
                              <div className="flex items-center gap-1 bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10 text-amber-600" title="Real trip review rating">
                                <Star className="size-3 fill-amber-500 text-amber-500" />
                                <span className="font-extrabold">{tripRating}</span>
                                <span className="text-[10px] text-muted-foreground font-medium">({reviewsCount})</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 rounded-md bg-muted border border-border/40">New</span>
                            )}

                            <div className="flex items-center gap-4 lg:pl-4">
                              <span className="font-extrabold text-foreground text-sm">{formatCurrencyRs(trip.price)}</span>
                              <Button size="sm" variant="outline" asChild className="h-8 font-bold cursor-pointer">
                                <Link href={`/trips/${trip.id}`}>View Details</Link>
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Nested Reviews/Feedbacks for this Trip */}
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
                                  <div 
                                    key={review.id} 
                                    className="bg-muted/30 border border-border/50 p-3.5 rounded-xl space-y-2 text-xs"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="size-6 rounded-full bg-secondary flex items-center justify-center font-bold text-[10px] text-secondary-foreground">
                                          {reviewerInitials}
                                        </div>
                                        <div>
                                          <span className="font-bold text-foreground block">
                                            {reviewerName}
                                          </span>
                                          <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                              <Star 
                                                key={i} 
                                                className={`size-2.5 ${
                                                  i < review.rating 
                                                    ? "fill-amber-500 text-amber-500" 
                                                    : "text-muted-foreground/30"
                                                }`}
                                              />
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                      <span className="text-[9px] text-muted-foreground font-semibold">
                                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                                      </span>
                                    </div>
                                    <p className="text-foreground/80 leading-relaxed italic">
                                      "{review.comment}"
                                    </p>
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



      <Footer />
    </div>
  );
}
