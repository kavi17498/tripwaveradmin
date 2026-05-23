"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/feedback/toast-provider";
import { tripApiService } from "@/lib/services/tripApiService";
import { userService } from "@/lib/services/userService";
import { useAuthCacheStore } from "@/lib/stores/useAuthCacheStore";
import { Mail, Phone, MapPin, CreditCard, Check, X, Loader2, Users } from "lucide-react";

interface Participant {
  participantId: string;
  bookingId?: string;
  parentUserId?: string;
  name: string;
  age: number;
  gender: string;
  address?: string;
  phone?: string;
  email?: string;
  paymentMethod?: string;
  status?: 'pending' | 'accepted' | 'rejected';
}

interface BookingGroup {
  bookingId: string | null;
  parentUserId: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  paymentMethod: string;
  buyerProfileImage?: string;
  participants: Participant[];
}

export default function TripParticipantsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthCacheStore((state) => state.token);
  const { pushToast } = useToast();

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [userProfileImages, setUserProfileImages] = useState<Record<string, string>>({});

  const loadTripData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const result = await tripApiService.getTripById(id, token);
      if (result.data) {
        const tripData = result.data;
        setTrip(tripData);

        // Fetch user profiles for all unique parentUserIds to resolve profile images
        if (tripData.participants && Array.isArray(tripData.participants)) {
          const uids = Array.from(
            new Set(
              tripData.participants
                .map((p: any) => p.parentUserId)
                .filter((uid: any): uid is string => Boolean(uid))
            )
          );

          const imagesMap: Record<string, string> = {};
          await Promise.all(
            uids.map(async (uid) => {
              try {
                const res = await userService.getUserProfileById(uid, token);
                console.log("Fetched user profile data for", uid, res.data);
                if (res.data) {
                  const img =
                    res.data.profileImage ||
                    (res.data as any).avatarUrl ||
                    (res.data as any).profileImageUrl ||
                    (res.data as any).avatar ||
                    (res.data as any).photoURL ||
                    "";
                  if (img) {
                    imagesMap[uid] = img;
                  }
                }
              } catch (err) {
                console.error("Failed to fetch user profile image for user ID:", uid, err);
              }
            })
          );
          setUserProfileImages(imagesMap);
        }
      } else {
        pushToast({ type: "error", title: "Error", description: "Trip not found." });
      }
    } catch (err) {
      pushToast({
        type: "error",
        title: "Load failed",
        description: err instanceof Error ? err.message : "Failed to load participants."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && token) {
      loadTripData();
    }
  }, [id, token]);

  // Group participants by bookingId
  const bookingGroups = useMemo((): BookingGroup[] => {
    if (!trip || !Array.isArray(trip.participants)) return [];

    const groups: Record<string, Participant[]> = {};
    let fallbackCounter = 0;

    trip.participants.forEach((p: Participant) => {
      const key = p.bookingId || p.parentUserId || `fallback_${fallbackCounter++}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(p);
    });

    return Object.entries(groups).map(([key, list]) => {
      // The buyer/main participant usually has the contact details filled
      const buyer = list.find((p) => p.address || p.phone || p.email) || list[0];
      const parentUserId = list.find((p) => p.parentUserId)?.parentUserId || null;
      return {
        bookingId: list[0].bookingId || null,
        parentUserId,
        status: list[0].status || 'accepted',
        buyerName: buyer.name,
        buyerEmail: buyer.email || "No email",
        buyerPhone: buyer.phone || "No phone",
        buyerAddress: buyer.address || "No address",
        paymentMethod: list[0].paymentMethod || "Not specified",
        buyerProfileImage: parentUserId ? userProfileImages[parentUserId] : undefined,
        participants: list,
      };
    });
  }, [trip, userProfileImages]);

  // Filter groups by query
  const filteredGroups = useMemo(() => {
    if (!query) return bookingGroups;
    const lowerQuery = query.toLowerCase();
    return bookingGroups.filter((g) =>
      g.buyerName.toLowerCase().includes(lowerQuery) ||
      g.buyerEmail.toLowerCase().includes(lowerQuery) ||
      g.participants.some((p) => p.name.toLowerCase().includes(lowerQuery))
    );
  }, [bookingGroups, query]);

  const handleUpdateStatus = async (group: BookingGroup, newStatus: 'accepted' | 'rejected') => {
    if (!token) return;
    const participantIds = group.participants.map((p) => p.participantId).filter(Boolean);
    if (participantIds.length === 0) return;

    const groupKey = group.bookingId || group.parentUserId || "group";
    const actionId = `${groupKey}_${newStatus}`;
    setActionLoadingId(actionId);

    try {
      await tripApiService.updateParticipantsStatus(id, participantIds, newStatus, token);
      pushToast({
        type: "success",
        title: newStatus === 'accepted' ? "Booking Approved" : "Booking Rejected",
        description: `Successfully ${newStatus === 'accepted' ? 'approved' : 'rejected'} the booking request.`
      });
      await loadTripData();
    } catch (err) {
      pushToast({
        type: "error",
        title: "Action failed",
        description: err instanceof Error ? err.message : "Failed to update booking status."
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6">
      <PageHeader 
        title="Trip Participation Approvals" 
        description={`Review bookings and manage participants for trip "${trip?.tripName || '...'}"`} 
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="w-full sm:max-w-xs">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by name or email..." />
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading participation list...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground">No participation requests found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {query ? "Try refining your search query." : "When travelers book this trip, their approval requests will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group, index) => {
            const groupKey = group.bookingId || group.parentUserId || `group_${index}`;
            const isProcessingApprove = actionLoadingId === `${groupKey}_accepted`;
            const isProcessingReject = actionLoadingId === `${groupKey}_rejected`;
            
            return (
              <article 
                key={groupKey} 
                className={`border rounded-lg bg-card shadow-sm transition-all overflow-hidden ${
                  group.status === 'pending' 
                    ? 'border-amber-200 bg-amber-50/10' 
                    : group.status === 'accepted' 
                    ? 'border-emerald-100 bg-emerald-50/5'
                    : 'border-border opacity-75'
                }`}
              >
                {/* Header: Booker info */}
                <div className="p-4 border-b border-border bg-muted/20 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* User profile image / avatar */}
                    {group.buyerProfileImage ? (
                      <img 
                        src={group.buyerProfileImage} 
                        alt={group.buyerName} 
                        className="h-12 w-12 rounded-full object-cover border border-border shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-border font-bold text-sm shadow-sm flex-shrink-0 uppercase">
                        {group.buyerName.slice(0, 2)}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg text-foreground leading-tight">
                          {group.buyerName}
                        </h3>
                        <StatusBadge status={group.status} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{group.buyerEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{group.buyerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 md:col-span-2">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{group.buyerAddress}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="font-medium text-foreground">{group.paymentMethod}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approve / Reject Actions */}
                  {group.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
                        disabled={actionLoadingId !== null}
                        onClick={() => handleUpdateStatus(group, 'accepted')}
                      >
                        {isProcessingApprove ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex items-center gap-1.5 shadow-sm"
                        disabled={actionLoadingId !== null}
                        onClick={() => handleUpdateStatus(group, 'rejected')}
                      >
                        {isProcessingReject ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        Reject
                      </Button>
                    </div>
                  )}
                </div>

                {/* Body: Participants in this booking */}
                <div className="p-4 bg-card">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Travelers ({group.participants.length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.participants.map((p) => (
                      <div 
                        key={p.participantId} 
                        className="p-3 rounded-md bg-muted/30 border border-border flex flex-col justify-between text-sm"
                      >
                        <p className="font-medium text-foreground">{p.name}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                          <span>Age: <strong className="text-foreground">{p.age}</strong></span>
                          <span>Gender: <strong className="text-foreground capitalize">{p.gender}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
