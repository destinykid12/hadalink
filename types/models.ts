/**
 * HadaLink core domain models.
 * These types describe the shape of every record in the local database.
 * They are intentionally backend-agnostic so the same contracts can be
 * reused when localStorage is replaced by a REST API or server actions.
 */

export type Role = "FARMER" | "PROVIDER" | "ADMIN";

export type UserStatus = "ACTIVE" | "SUSPENDED";

export type ListingType = "EQUIPMENT" | "SERVICE";

export type ListingStatus = "ACTIVE" | "INACTIVE";

export type PricingUnit = "FIXED" | "PER_HOUR" | "PER_HECTARE" | "PER_DAY" | "PER_JOB";

export type EquipmentCondition = "NEW" | "EXCELLENT" | "GOOD" | "FAIR";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "IN_PROGRESS"
  | "COMPLETED";

export type PaymentStatus = "PENDING" | "SUCCESSFUL" | "FAILED";

export type VerificationStatus = "UNSUBMITTED" | "PENDING" | "VERIFIED" | "REJECTED";

export type AvailabilityStatus = "AVAILABLE" | "BOOKED" | "UNAVAILABLE";

export type NotificationType =
  | "BOOKING_SUBMITTED"
  | "BOOKING_ACCEPTED"
  | "BOOKING_REJECTED"
  | "BOOKING_CANCELLED"
  | "BOOKING_COMPLETED"
  | "BOOKING_IN_PROGRESS"
  | "PAYMENT_SUCCESSFUL"
  | "PAYMENT_FAILED"
  | "PAYMENT_PENDING"
  | "PAYMENT_RECEIVED"
  | "REVIEW_AVAILABLE"
  | "NEW_REVIEW"
  | "NEW_BOOKING_REQUEST"
  | "NEW_MESSAGE"
  | "VERIFICATION_SUBMITTED"
  | "VERIFICATION_APPROVED"
  | "VERIFICATION_REJECTED"
  | "LISTING_APPROVED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_REACTIVATED";

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

/** Authentication record and shared profile fields. */
export interface User extends Timestamps {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  /** Simulated credential storage. Never do this in production. */
  password: string;
  location: string;
  avatar: string;
  status: UserStatus;
}

/** Farmer-specific profile, one per FARMER user. */
export interface FarmerProfile extends Timestamps {
  id: string;
  userId: string;
  farmName: string;
  farmSize: number; // hectares
  farmLocation: string;
  preferredServices: string[];
}

/** Provider-specific profile, one per PROVIDER user. */
export interface ProviderProfile extends Timestamps {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  verificationStatus: VerificationStatus;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  serviceAreas: string[];
}

export interface Category extends Timestamps {
  id: string;
  name: string;
  slug: string;
  description: string;
  listingType: ListingType | "BOTH";
  icon: string;
}

/** Marketplace listing. Can represent equipment rental or a mechanization service. */
export interface Listing extends Timestamps {
  id: string;
  providerId: string; // ProviderProfile id
  title: string;
  categoryId: string;
  type: ListingType;
  description: string;
  images: string[];
  location: string;
  price: number;
  pricingUnit: PricingUnit;
  condition: EquipmentCondition;
  operatorIncluded: boolean;
  terms: string;
  status: ListingStatus;
  rating: number;
  reviewCount: number;
}

/** Extra spec sheet for listings of type EQUIPMENT. */
export interface EquipmentProfile extends Timestamps {
  id: string;
  listingId: string;
  brand: string;
  model: string;
  horsepower: number;
  yearOfManufacture: number;
}

/** Extra scope sheet for listings of type SERVICE. */
export interface ServiceProfile extends Timestamps {
  id: string;
  listingId: string;
  scope: string;
  durationEstimate: string;
  includesOperator: boolean;
  deliverables: string;
}

/** Per-date availability managed by providers. */
export interface AvailabilityEntry extends Timestamps {
  id: string;
  listingId: string;
  date: string; // yyyy-mm-dd
  status: AvailabilityStatus;
  note?: string;
}

export interface Booking extends Timestamps {
  id: string;
  reference: string;
  farmerId: string; // FarmerProfile id
  providerId: string; // ProviderProfile id
  listingId: string;
  /** Snapshots keep history readable even if the listing changes later. */
  listingTitle: string;
  listingType: ListingType;
  date: string; // yyyy-mm-dd
  location: string;
  notes: string;
  quantity: number; // hectares / hours / days depending on pricing unit
  amount: number;
  commissionRate: number;
  commission: number;
  providerAmount: number;
  status: BookingStatus;
  acceptedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  rejectionReason?: string;
}

export interface Review extends Timestamps {
  id: string;
  bookingId: string;
  farmerId: string;
  providerId: string;
  listingId: string;
  rating: number; // 1..5
  comment: string;
}

export interface Transaction extends Timestamps {
  id: string;
  reference: string;
  bookingId: string;
  farmerId: string;
  providerId: string;
  listingId: string;
  grossAmount: number;
  commissionRate: number;
  commission: number;
  providerAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paidAt?: string;
}

export interface AppNotification extends Timestamps {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
}

export interface Message extends Timestamps {
  id: string;
  bookingId: string;
  threadId: string;
  senderUserId: string;
  recipientUserId: string;
  body: string;
  read: boolean;
}

export interface SavedListing extends Timestamps {
  id: string;
  userId: string;
  listingId: string;
}

export interface VerificationRequest extends Timestamps {
  id: string;
  providerId: string; // ProviderProfile id
  businessName: string;
  phone: string;
  location: string;
  identificationInfo: string;
  equipmentInfo: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface AppSettings {
  commissionRate: number; // 0.05 = 5%
  currency: string;
  demoMode: boolean;
  seededAt: string;
  schemaVersion: number;
}

/** Simulated session stored in localStorage. */
export interface Session {
  userId: string;
  startedAt: string;
}

/** Shape of the whole local database. */
export interface DatabaseShape {
  users: User[];
  farmers: FarmerProfile[];
  providers: ProviderProfile[];
  equipment: EquipmentProfile[];
  services: ServiceProfile[];
  categories: Category[];
  listings: Listing[];
  availability: AvailabilityEntry[];
  bookings: Booking[];
  reviews: Review[];
  transactions: Transaction[];
  notifications: AppNotification[];
  messages: Message[];
  savedListings: SavedListing[];
  verificationRequests: VerificationRequest[];
  settings: AppSettings;
}

export type CollectionName = keyof DatabaseShape;

/** Result envelope used by services instead of throwing for expected failures. */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface ListingSearchFilters {
  query?: string;
  categoryId?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: ListingType | "ALL";
  availableOnly?: boolean;
  operatorRequired?: boolean;
  verifiedOnly?: boolean;
  sort?: "RELEVANCE" | "PRICE_LOW" | "PRICE_HIGH" | "NEWEST" | "RATING";
}

export interface DashboardStats {
  totalFarmers: number;
  totalProviders: number;
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  totalTransactionValue: number;
  totalCommission: number;
  pendingVerifications: number;
}

export interface ProviderStats {
  totalListings: number;
  activeListings: number;
  bookingRequests: number;
  confirmedBookings: number;
  completedJobs: number;
  earnings: number;
  commissionPaid: number;
  averageRating: number;
  reviewCount: number;
  verificationStatus: VerificationStatus;
}

export interface FarmerStats {
  totalBookings: number;
  pendingRequests: number;
  upcomingBookings: number;
  completedBookings: number;
  savedListings: number;
  totalSpent: number;
}

/** Joined display models used by the UI. */
export interface ListingWithRelations extends Listing {
  provider: ProviderProfile & { user: User };
  category: Category;
  equipment?: EquipmentProfile;
  service?: ServiceProfile;
  nextAvailableDate: string | null;
  bookedDates: string[];
  unavailableDates: string[];
}

export interface BookingWithRelations extends Booking {
  farmer: FarmerProfile & { user: User };
  provider: ProviderProfile & { user: User };
  listing: Listing;
  review?: Review;
  transaction?: Transaction;
}

export interface ThreadWithRelations {
  threadId: string;
  bookingId: string;
  booking: Booking;
  farmerUser: User;
  providerUser: User;
  messages: Message[];
  lastMessageAt: string;
  unreadCount: number;
}
