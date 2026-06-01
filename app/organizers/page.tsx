"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userService, UserProfileRecord } from "@/lib/services/userService";
import { chatService } from "@/lib/services/chatService";
import { userSessionService } from "@/lib/services/userSessionService";
import { useToast } from "@/components/feedback/toast-provider";
import { 
  MapPin, 
  MessageSquare, 
  ShieldCheck, 
  Search, 
  Compass, 
  Loader2 
} from "lucide-react";

export default function OrganizersDirectoryPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [organizers, setOrganizers] = useState<UserProfileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [creatingChatId, setCreatingChatId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(userSessionService.getUserProfile<any>());

    const loadOrganizers = async () => {
      try {
        setLoading(true);
        const res = await userService.getOrganizers();
        setOrganizers(res.data ?? []);
      } catch (err: any) {
        pushToast({
          title: "Error Loading Organizers",
          description: err?.message || "Failed to load organizers list.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadOrganizers();
  }, [pushToast]);

  const filteredOrganizers = useMemo(() => {
    return organizers.filter((org) => {
      const fullName = `${org.firstName || ""} ${org.lastName || ""}`.toLowerCase();
      const city = (org.city || "").toLowerCase();
      const country = (org.country || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || city.includes(query) || country.includes(query);
    });
  }, [organizers, searchQuery]);

  const handleMessageOrganizer = async (org: UserProfileRecord) => {
    if (!currentUser) {
      pushToast({
        title: "Authentication Required",
        description: "Please sign in to message this organizer.",
        type: "error",
      });
      router.push(`/login?redirect=/organizers`);
      return;
    }

    const token = userSessionService.getToken();
    if (!token) {
      pushToast({
        title: "Authentication Required",
        description: "Please sign in to message this organizer.",
        type: "error",
      });
      router.push(`/login?redirect=/organizers`);
      return;
    }

    try {
      setCreatingChatId(org.id ?? null);
      const travelerId = currentUser.id;
      const guideId = org.id as string;

      const sortedIds = [travelerId, guideId].sort();
      const dmTripId = `dm-${sortedIds[0]}-${sortedIds[1]}`;

      const travelerName = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || "Traveler";
      const guideName = `${org.firstName || ""} ${org.lastName || ""}`.trim() || "Guide";
      const dmName = `${travelerName} | ${guideName}`;

      const response = await chatService.createChatGroup({
        tripId: dmTripId,
        name: dmName,
        adminId: travelerId,
        adminName: travelerName,
        description: `Direct message group between ${travelerName} and ${guideName}`,
        members: [travelerId, guideId],
      }, token);

      if (response.data) {
        pushToast({
          title: "Chat Initialized",
          description: `Opening conversation with ${guideName}...`,
          type: "success",
        });
        router.push(`/chat?tripId=${dmTripId}`);
      } else {
        throw new Error(response.message || "Could not start chat");
      }
    } catch (err: any) {
      pushToast({
        title: "Error Starting Chat",
        description: err?.message || "Failed to start direct message.",
        type: "error",
      });
    } finally {
      setCreatingChatId(null);
    }
  };

  const getInitials = (org: UserProfileRecord) => {
    const first = org.firstName?.[0] || "";
    const last = org.lastName?.[0] || "";
    return (first + last).toUpperCase() || "LG";
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-1 w-full bg-background pb-24">
        {/* Immersive Header Banner */}
        <section className="relative h-[220px] md:h-[280px] w-full flex items-center bg-zinc-950 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1600&auto=format&fit=crop" 
              alt="Sri Lanka Travel Planning" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
          </div>
          
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 text-white space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[10px] font-bold tracking-[0.15em] uppercase text-sky-400 backdrop-blur-md border border-white/10">
              Verified Host Practitioners
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-white max-w-3xl">
              Verified Guides & Organizers
            </h1>
            <p className="text-sm md:text-base text-zinc-300 max-w-2xl font-light">
              Connect directly with verified local guides, inquire about customizable itineraries, or start a chat session.
            </p>
          </div>
        </section>

        {/* Main Content (Floating slightly over header banner) */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-6 -mt-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/80 rounded-2xl p-4 shadow-lg">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {!loading && (
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1.5 rounded-full border border-border/40 w-fit">
                {filteredOrganizers.length} {filteredOrganizers.length === 1 ? 'Guide' : 'Guides'} found
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex h-60 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground font-semibold">Loading guides directory...</span>
            </div>
          ) : filteredOrganizers.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
              <Compass className="mx-auto size-12 text-muted-foreground/50 animate-pulse" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No Guides Found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery ? "Try refining your search terms." : "There are currently no verified guides registered in the system."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrganizers.map((org) => {
                const fullName = `${org.firstName || ""} ${org.lastName || ""}`.trim() || "Local Guide";
                return (
                  <div
                    key={org.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border/85 bg-card p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:border-primary/40"
                  >
                    <div className="space-y-4">
                      {/* Top Header: Avatar & Info */}
                      <div className="flex items-start gap-4">
                        {org.profileImage ? (
                          <img
                            src={org.profileImage}
                            alt={fullName}
                            className="size-16 rounded-full object-cover border-2 border-background shadow-md"
                          />
                        ) : (
                          <div className="flex size-16 items-center justify-center rounded-full bg-linear-to-tr from-sky-500 to-indigo-600 font-bold text-white text-xl shadow-md">
                            {getInitials(org)}
                          </div>
                        )}

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-extrabold text-foreground truncate text-base group-hover:text-primary transition-colors">
                              {fullName}
                            </h4>
                            {org.isVerified && (
                              <span title="Verified Organizer">
                                <ShieldCheck className="size-4 shrink-0 fill-emerald-500 stroke-white" />
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
                            <MapPin className="size-3 text-primary/70 shrink-0" />
                            <span className="truncate">{org.city ? `${org.city}, ${org.country || "Sri Lanka"}` : "Sri Lanka"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bio Description */}
                      <p className="text-xs text-muted-foreground/90 font-medium line-clamp-3 min-h-[48px] leading-relaxed">
                        {org.bio || "Hi, I plan custom and guided journeys across Sri Lanka, focusing on local encounters, safety, and authentic hospitality."}
                      </p>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-6 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 font-bold text-xs cursor-pointer rounded-full"
                        asChild
                      >
                        <Link href={`/organizers/${org.id}`}>View Profile</Link>
                      </Button>

                      {(!currentUser || currentUser.id !== org.id) && (
                        <Button
                          size="sm"
                          className="flex-1 font-bold text-xs cursor-pointer rounded-full"
                          onClick={() => handleMessageOrganizer(org)}
                          disabled={creatingChatId === org.id}
                        >
                          <MessageSquare className="size-3.5 mr-1" />
                          {creatingChatId === org.id ? "Connecting..." : "Message"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
