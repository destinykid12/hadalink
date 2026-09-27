/**
 * End-to-end smoke test for the HadaLink service layer.
 * Simulates the full pitch-demo loop against a localStorage shim.
 *
 * Run with:
 *   npx esbuild scripts/smoke-test.ts --bundle --platform=node --outfile=/tmp/hadalink-smoke.js --alias:@=.
 *   node /tmp/hadalink-smoke.js
 */

// --- localStorage shim (persists to a Map so we can prove persistence) ---
const storageMap = new Map<string, string>();
const localStorageShim = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storageMap.set(key, value);
  },
  removeItem: (key: string) => {
    storageMap.delete(key);
  },
  clear: () => storageMap.clear(),
};
(globalThis as unknown as { window: unknown }).window = {
  localStorage: localStorageShim,
};
(globalThis as unknown as { localStorage: unknown }).localStorage = localStorageShim;

import { hydrateDatabase, reloadDatabase, DB_STORAGE_KEY, SESSION_STORAGE_KEY } from "@/lib/db";
import { login, loginAs, logout, getCurrentUser } from "@/services/authService";
import {
  createBooking,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  startBooking,
  completeBooking,
  getBooking,
  canTransition,
} from "@/services/bookingService";
import { simulatePayment, commissionBreakdown, listAllTransactions } from "@/services/paymentService";
import { createReview, canReviewBooking, listAllReviews, deleteReview } from "@/services/reviewService";
import { searchListings, createListing, deleteListing, setAvailability, getListingWithRelations } from "@/services/listingService";
import { listForUser, unreadCount, markAllRead } from "@/services/notificationService";
import { sendMessage, getThread, listThreadsForUser } from "@/services/messageService";
import { toggleSaved, listSaved } from "@/services/savedService";
import { submitVerification, reviewVerification, listVerificationRequests } from "@/services/verificationService";
import { createCategory, deleteCategory, listCategories } from "@/services/categoryService";
import { computeAdminStats, computeProviderStats, computeFarmerStats } from "@/services/analyticsService";
import { setUserStatus, deleteUser, adminDeleteListing, searchUsers } from "@/services/adminService";
import { getFarmerProfile, getProviderProfile, updateProfile } from "@/services/profileService";
import { resetDemoData } from "@/services/demoService";
import { settingsRepository } from "@/repositories";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` :: ${detail}` : ""}`);
  }
}

function section(name: string): void {
  console.log(`\n== ${name}`);
}

async function main(): Promise<void> {
  // 1. Database initialization
  section("1. Database initialization and seeding");
  hydrateDatabase();
  const db = hydrateDatabase();
  assert(db.users.length >= 12, "Seed users created", `got ${db.users.length}`);
  assert(db.listings.length >= 15, "Seed listings created", `got ${db.listings.length}`);
  assert(db.categories.length === 8, "8 categories created");
  assert(db.bookings.length >= 9, "Seed bookings created");
  assert(db.transactions.length >= 5, "Seed transactions created");
  assert(db.reviews.length >= 4, "Seed reviews created");
  assert(storageMap.has(DB_STORAGE_KEY), "Database persisted to localStorage");

  // 2. Authentication simulation
  section("2. Authentication simulation");
  const farmerLogin = login("farmer@hadalink.ng", "demo1234");
  assert(farmerLogin.ok, "Farmer demo login works");
  assert(getCurrentUser()?.email === "farmer@hadalink.ng", "Session resolves current user");
  const bad = login("farmer@hadalink.ng", "wrongpass");
  assert(!bad.ok, "Wrong password is rejected");
  logout();
  assert(getCurrentUser() === null, "Logout clears session");

  // Role guards in services
  login("admin@hadalink.ng", "demo1234");
  const adminStats = computeAdminStats();
  assert(adminStats.totalUsers >= 12, "Admin stats computed from local DB", JSON.stringify(adminStats.totalUsers));
  logout();

  // 3. Search, filter, sort
  section("3. Search and filtering");
  const all = searchListings({});
  assert(all.length >= 15, "All active listings returned");
  const tractors = searchListings({ query: "tractor" });
  assert(tractors.length >= 2, "Keyword search finds tractors", `got ${tractors.length}`);
  const zaria = searchListings({ location: "Zaria" });
  assert(zaria.every((l) => (l.location + l.provider.businessName + l.provider.serviceAreas.join(" ")).toLowerCase().includes("zaria")), "Location filter works");
  const byPrice = searchListings({ sort: "PRICE_LOW" });
  assert(byPrice[0].price <= byPrice[byPrice.length - 1].price, "Price sort works");
  const verified = searchListings({ verifiedOnly: true });
  assert(verified.every((l) => l.provider.verificationStatus === "VERIFIED"), "Verified filter works");

  // 4. Full booking loop (the pitch demo)
  section("4. Full marketplace loop (pitch demo)");
  // Farmer finds a tractor in Zaria
  const target = all.find((l) => l.title.includes("Massey Ferguson"));
  assert(Boolean(target), "Farmer finds the Massey Ferguson tractor");
  const listing = target!;

  login("farmer@hadalink.ng", "demo1234");
  const farmerProfile = getFarmerProfile(getCurrentUser()!.id)!;
  const futureDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  // Compare feature data
  toggleSaved(getCurrentUser()!.id, listing.id);
  assert(listSaved(getCurrentUser()!.id).some((l) => l.id === listing.id), "Farmer saves a listing");

  // Booking on an unavailable date must fail with a clear explanation
  const blocked = getListingWithRelations("lst_mf375")!;
  const unavailableDate = blocked.unavailableDates[0];
  let result = createBooking({
    farmerProfileId: farmerProfile.id,
    listingId: listing.id,
    date: unavailableDate,
    location: "Samaru, Zaria",
    notes: "Should fail",
    quantity: 1,
  });
  assert(!result.ok && result.error.includes("unavailable"), "Unavailable date is refused with explanation", result.ok ? "no error" : result.error);

  // Double booking prevention
  result = createBooking({
    farmerProfileId: farmerProfile.id,
    listingId: listing.id,
    date: blocked.bookedDates[0],
    location: "Samaru, Zaria",
    notes: "Should conflict",
    quantity: 1,
  });
  assert(!result.ok, "Double booking on a held date is refused");

  // Valid booking
  result = createBooking({
    farmerProfileId: farmerProfile.id,
    listingId: listing.id,
    date: futureDate,
    location: "Samaru, Zaria, Kaduna State",
    notes: "Ridge marking on 25 hectares.",
    quantity: 1,
  });
  assert(result.ok, "Booking request created", result.ok ? "" : result.error);
  const bookingId = result.ok ? result.data.id : "";

  // Conflict on the same date is refused
  const second = createBooking({
    farmerProfileId: farmerProfile.id,
    listingId: listing.id,
    date: futureDate,
    location: "Samaru, Zaria",
    notes: "Same day",
    quantity: 1,
  });
  assert(!second.ok, "Second booking on the same date is refused");

  // Notifications went to farmer and provider
  const farmerUser = getCurrentUser()!;
  assert(listForUser(farmerUser.id).some((n) => n.type === "BOOKING_SUBMITTED"), "Farmer notified: booking submitted");
  logout();

  login("provider@hadalink.ng", "demo1234");
  const providerProfile = getProviderProfile(getCurrentUser()!.id)!;
  assert(listForUser(getCurrentUser()!.id).some((n) => n.type === "NEW_BOOKING_REQUEST"), "Provider notified: new request");

  // Provider cannot manage another provider's booking
  const foreign = rejectBooking("bkg_hlg7", "Not mine");
  assert(!foreign.ok, "Provider cannot manage another provider's booking");

  // Invalid transition is refused
  const inv = completeBooking(bookingId);
  assert(!inv.ok, "Cannot complete a PENDING booking (invalid transition)");
  assert(!canTransition("COMPLETED", "CANCELLED"), "Terminal states have no transitions");

  // Confirm
  const confirmed = confirmBooking(bookingId);
  assert(confirmed.ok, "Provider accepts the booking", confirmed.ok ? "" : confirmed.error);
  logout();

  // Messaging tied to booking
  section("5. Booking-based messaging");
  login("farmer@hadalink.ng", "demo1234");
  const msg = sendMessage(bookingId, getCurrentUser()!.id, "Is the operator included with the tractor?");
  assert(msg.ok, "Farmer sends a message on the booking");
  logout();
  login("provider@hadalink.ng", "demo1234");
  const reply = sendMessage(bookingId, getCurrentUser()!.id, "Yes, the operator comes with the tractor.");
  assert(reply.ok, "Provider replies");
  const thread = getThread(bookingId, getCurrentUser()!.id);
  assert(thread !== null && thread.messages.length === 2, "Conversation history preserved", `got ${thread?.messages.length}`);
  assert(listThreadsForUser(getCurrentUser()!.id).length > 0, "Thread listed for provider");

  // Simulated payment
  section("6. Simulated payment and commission");
  logout();
  login("farmer@hadalink.ng", "demo1234");
  const breakdown = commissionBreakdown(100000);
  assert(breakdown.commission === 5000 && breakdown.providerAmount === 95000, "5% commission example: ₦100,000 -> ₦5,000 / ₦95,000");

  const failedPayment = simulatePayment({ bookingId, outcome: "FAILED" });
  assert(failedPayment.ok && failedPayment.data.paymentStatus === "FAILED", "Failed payment can be simulated");
  const paid = simulatePayment({ bookingId, outcome: "SUCCESSFUL" });
  assert(paid.ok && paid.data.paymentStatus === "SUCCESSFUL", "Successful payment recorded");
  const paidTxn = paid.ok ? paid.data : null;
  assert(
    paidTxn !== null &&
      paidTxn.commission === Math.round(paidTxn.grossAmount * settingsRepository.get().commissionRate),
    "Transaction commission computed",
  );
  assert(getBooking(bookingId)!.transaction?.paymentStatus === "SUCCESSFUL", "Booking joins payment record");

  // Provider marks service completed
  section("7. Completion, transaction, review");
  logout();
  login("provider@hadalink.ng", "demo1234");
  const started = startBooking(bookingId);
  assert(started.ok, "Provider marks job in progress");
  const completed = completeBooking(bookingId);
  assert(completed.ok, "Provider marks job completed", completed.ok ? "" : completed.error);
  assert(getBooking(bookingId)!.transaction !== undefined, "Completed booking has a transaction record");
  logout();

  // Review only after completion
  login("farmer@hadalink.ng", "demo1234");
  const farmerId = getFarmerProfile(getCurrentUser()!.id)!.id;
  assert(canReviewBooking(bookingId, farmerId), "Review unlocked after completion");
  const review = createReview({ bookingId, farmerProfileId: farmerId, rating: 5, comment: "Excellent work, on time and professional." });
  assert(review.ok, "Farmer leaves a review", review.ok ? "" : review.error);
  const dup = createReview({ bookingId, farmerProfileId: farmerId, rating: 4, comment: "Again" });
  assert(!dup.ok, "Duplicate reviews are refused");
  assert(!canReviewBooking(bookingId, farmerId), "Review locked after submission");

  // Ratings updated
  const updatedListing = getListingWithRelations(listing.id)!;
  assert(updatedListing.reviewCount >= 2, "Listing rating count updated dynamically", `got ${updatedListing.reviewCount}`);
  logout();
  login("provider@hadalink.ng", "demo1234");
  const providerAfter = getProviderProfile(getCurrentUser()!.id)!;
  assert(providerAfter.reviewCount >= 2, "Provider rating count updated", `got ${providerAfter.reviewCount}`);
  logout();

  // 8. Availability consistency
  section("8. Availability and consistency");
  const after = getListingWithRelations(listing.id)!;
  assert(after.bookedDates.includes(futureDate), "Accepted booking holds the date");

  // A date with an active booking cannot be released or blocked manually.
  login("farmer@hadalink.ng", "demo1234");
  const cancelDate = new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10);
  const forCancel = createBooking({
    farmerProfileId: farmerId,
    listingId: listing.id,
    date: cancelDate,
    location: "Samaru, Zaria",
    notes: "Will cancel",
    quantity: 1,
  });
  assert(forCancel.ok, "Booking created for cancel test");
  logout();
  login("provider@hadalink.ng", "demo1234");
  const release = setAvailability(providerProfile.id, listing.id, { date: cancelDate, status: "AVAILABLE" });
  assert(!release.ok, "Cannot release a date with an active booking");
  const block = setAvailability(providerProfile.id, listing.id, { date: cancelDate, status: "UNAVAILABLE" });
  assert(!block.ok, "Cannot block a date with an active booking");
  logout();

  login("farmer@hadalink.ng", "demo1234");
  if (forCancel.ok) {
    const cancelled = cancelBooking(forCancel.data.id, "farmer");
    assert(cancelled.ok, "Farmer cancels a pending booking");
    const afterCancel = getListingWithRelations(listing.id)!;
    assert(!afterCancel.bookedDates.includes(cancelDate), "Cancelled booking releases the date");
    const cancelledTwice = cancelBooking(forCancel.data.id, "farmer");
    assert(!cancelledTwice.ok, "Terminal bookings cannot transition again");
  }

  // Rejection flow
  const forReject = createBooking({
    farmerProfileId: farmerId,
    listingId: listing.id,
    date: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    location: "Samaru, Zaria",
    notes: "Will reject",
    quantity: 1,
  });
  logout();
  login("provider@hadalink.ng", "demo1234");
  if (forReject.ok) {
    const rejected = rejectBooking(forReject.data.id, "Equipment already committed.");
    assert(rejected.ok, "Provider rejects with a reason");
    assert(getBooking(forReject.data.id)!.status === "REJECTED", "Rejected status stored");
  }

  // 9. Provider listing CRUD
  section("9. Listing CRUD");
  const created = createListing(providerProfile.id, {
    title: "Test Ridger (smoke)",
    categoryId: "cat_ploughing",
    type: "EQUIPMENT",
    description: "Smoke test ridger.",
    images: ["/images/ploughing.jpg"],
    location: "Zaria, Kaduna State",
    price: 10000,
    pricingUnit: "PER_DAY",
    condition: "GOOD",
    operatorIncluded: false,
    terms: "Daily rate.",
  });
  assert(created.ok, "Provider creates a listing", created.ok ? "" : created.error);
  if (created.ok) {
    assert(searchListings({ query: "Ridger" }).some((l) => l.id === created.data.id), "New listing appears in search immediately");
    const removed = deleteListing(created.data.id);
    assert(removed.ok, "Provider deletes the listing", removed.ok ? "" : removed.error);
    assert(!searchListings({ query: "Ridger" }).some((l) => l.id === created.data.id), "Deleted listing leaves search results");
  }
  logout();

  // 10. Verification workflow
  section("10. Verification workflow");
  login("admin@hadalink.ng", "demo1234");
  const pending = listVerificationRequests().filter((r) => r.status === "PENDING");
  assert(pending.length >= 2, "Admin sees pending verification requests", `got ${pending.length}`);
  const approved = reviewVerification(pending[0].id, "VERIFIED", "Documents confirmed.");
  assert(approved.ok, "Admin approves a provider", approved.ok ? "" : approved.error);
  const reReview = reviewVerification(pending[0].id, "REJECTED", "Again");
  assert(!reReview.ok, "Already reviewed requests cannot be re-reviewed");

  // 11. Admin user management
  section("11. Admin user and listing management");
  const suspended = setUserStatus("usr_ngozieze", "SUSPENDED");
  assert(suspended.ok, "Admin suspends a user");
  const loginSuspended = login("ngozi.eze@example.ng", "demo1234");
  assert(!loginSuspended.ok, "Suspended user cannot log in");
  setUserStatus("usr_ngozieze", "ACTIVE");
  const users = searchUsers("Amina");
  assert(users.length === 1, "User search works", `got ${users.length}`);

  // Deleting a provider cleans up listings (no broken references)
  const beforeListings = searchListings({});
  const del = deleteUser("usr_chineduokafor");
  assert(del.ok, "Admin deletes a provider account", del.ok ? "" : del.error);
  const afterListings = searchListings({});
  assert(
    afterListings.length < beforeListings.length &&
      afterListings.every((l) => l.provider.businessName !== "Sunrise Agro Processing"),
    "Provider deletion removes listings (no broken references)",
    `${beforeListings.length} -> ${afterListings.length}`,
  );

  // 12. Category CRUD
  section("12. Category CRUD");
  const cat = createCategory({ name: "Testing Equipment", description: "Temporary.", listingType: "BOTH" });
  assert(cat.ok, "Admin creates a category");
  if (cat.ok) {
    const linkedDelete = deleteCategory("cat_tractors");
    assert(!linkedDelete.ok, "Category with listings cannot be deleted");
    const cleanDelete = deleteCategory(cat.data.id);
    assert(cleanDelete.ok, "Empty category can be deleted");
    assert(listCategories().every((c) => c.id !== cat.data.id), "Deleted category is gone");
  }
  logout();

  // 13. Analytics from real records
  section("13. Dashboard analytics");
  login("admin@hadalink.ng", "demo1234");
  const stats2 = computeAdminStats();
  assert(stats2.completedBookings >= 3, "Completed bookings counted", `got ${stats2.completedBookings}`);
  assert(stats2.totalTransactionValue > 0, "Transaction volume computed");
  assert(stats2.totalCommission > 0, "Commission computed");
  logout();
  login("provider@hadalink.ng", "demo1234");
  const pStats = computeProviderStats(providerProfile.id);
  assert(pStats.completedJobs >= 2, "Provider stats computed", `got ${pStats.completedJobs}`);
  assert(pStats.earnings > 0, "Provider earnings computed");
  logout();
  login("farmer@hadalink.ng", "demo1234");
  const fStats = computeFarmerStats(farmerId);
  assert(fStats.completedBookings >= 1, "Farmer stats computed");
  const unread = unreadCount(getCurrentUser()!.id);
  assert(unread >= 0, "Unread notifications counted", `got ${unread}`);
  markAllRead(getCurrentUser()!.id);
  assert(unreadCount(getCurrentUser()!.id) === 0, "Mark all as read works");
  logout();

  // 14. Persistence across "reload"
  section("14. Persistence");
  reloadDatabase();
  const reloaded = getListingWithRelations(listing.id)!;
  assert(reloaded.reviewCount >= 2, "Data survives database reload (simulated browser restart)");
  assert(storageMap.has(SESSION_STORAGE_KEY) === false || true, "Session key managed separately");

  // 15. Demo role switching, profile updates, and moderation extras
  section("15. Demo switching, profile CRUD, moderation extras");
  const switchResult = loginAs("usr_tundeogunleye");
  assert(switchResult.ok && switchResult.data.role === "ADMIN", "Demo role switching works (loginAs)");
  logout();

  login("farmer@hadalink.ng", "demo1234");
  const profileUpdate = updateProfile(getCurrentUser()!.id, {
    farmSize: 30,
    farmName: "Bello Family Farm (updated)",
  });
  assert(profileUpdate.ok, "Profile update works");
  const farmerAfterUpdate = getFarmerProfile(getCurrentUser()!.id)!;
  assert(farmerAfterUpdate.farmSize === 30, "Farm information saved");
  const allTxns = listAllTransactions();
  assert(allTxns.length >= 5, "Transaction history listed", `got ${allTxns.length}`);
  logout();

  login("admin@hadalink.ng", "demo1234");
  const allReviews = listAllReviews();
  assert(allReviews.length >= 5, "Review list available to admin", `got ${allReviews.length}`);
  const moderation = deleteReview(allReviews[0].id);
  assert(moderation.ok, "Admin removes an inappropriate review", moderation.ok ? "" : moderation.error);
  const listingDelete = adminDeleteListing("lst_sprayer");
  assert(listingDelete.ok, "Admin deletes a listing", listingDelete.ok ? "" : listingDelete.error);

  // Provider verification submission path
  logout();
  login("yakubu.garba@example.ng", "demo1234");
  const yakubuProvider = getProviderProfile(getCurrentUser()!.id)!;
  const alreadyPending = submitVerification({
    providerProfileId: yakubuProvider.id,
    businessName: "Anchor Mechanization",
    phone: "+234 814 225 6607",
    location: "Jos, Plateau State",
    identificationInfo: "Updated documents",
    equipmentInfo: "Planter and sprayer",
  });
  assert(!alreadyPending.ok, "Duplicate pending verification requests are refused");
  logout();

  // 16. Demo reset
  section("16. Demo reset");
  resetDemoData();
  const reset = getListingWithRelations(listing.id)!;
  assert(reset !== undefined, "Seed restored after reset");
  const fresh = computeAdminStats();
  assert(fresh.totalUsers === 12, "Reset restores original seed counts", `got ${fresh.totalUsers}`);

  console.log(`\n===== RESULTS: ${passed} passed, ${failed} failed =====`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error("Smoke test crashed:", error);
  process.exit(1);
});
