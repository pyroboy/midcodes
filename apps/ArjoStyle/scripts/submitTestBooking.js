// submitTestBooking.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// --- Configuration ---
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const bookingsTableName = 'bookings'; // <--- CHANGE if your table name is different

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Error: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY must be set in the .env file.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Helper Functions for Random Data ---
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomBoolean() {
    return Math.random() < 0.5;
}

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateRandomPhone() {
    return `09${getRandomInt(100000000, 999999999)}`;
}

function generateRandomTimestamp() {
    return Date.now() + getRandomInt(1000, 1000000);
}

// --- Generate Test Booking Data ---
async function createTestData() {
    const timestamp = generateRandomTimestamp();
    const categories = ['Head & Face', 'Arms', 'Torso Front', 'Torso Back', 'Legs', 'Hands & Feet'];
    const placementsByCategory = {
        'Head & Face': ['Behind Ear', 'Neck Front', 'Neck Side', 'Neck Back', 'Eyebrow', 'Temple', 'Scalp'],
        'Arms': ['Inner Bicep', 'Outer Bicep', 'Inner Forearm', 'Outer Forearm', 'Wrist', 'Elbow', 'Shoulder Cap', 'Full Sleeve', 'Half Sleeve', 'Armpit'],
        'Torso Front': ['Chest Center', 'Chest Side', 'Stomach', 'Ribs', 'Sternum', 'Hip'],
        'Torso Back': ['Upper Back', 'Lower Back', 'Full Back', 'Spine'],
        'Legs': ['Thigh Front', 'Thigh Side', 'Thigh Back', 'Knee', 'Calf', 'Shin', 'Ankle', 'Full Leg', 'Inner Thigh'],
        'Hands & Feet': ['Hand Top', 'Fingers', 'Foot Top', 'Foot Side', 'Toes']
    };
    const availableTimeSlots = [
        '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM',
        '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
    ];
    const contactMethods = ['sms', 'call', 'whatsapp', 'instagram', 'facebook', 'email']; // Added email

    const selectedCategory = getRandomElement(categories);
    const selectedPlacement = getRandomElement(placementsByCategory[selectedCategory]);
    const estimatedDuration = getRandomInt(30, 300); // 30 mins to 5 hours

    // --- Generate Placeholder Image Data ---
    // This mimics the structure but doesn't actually upload or use Cloudinary URLs
    const numImages = getRandomInt(0, 5);
    const referenceImagesData = [];
    for (let i = 0; i < numImages; i++) {
        const fakePublicId = `test_refs/image_${timestamp}_${i}`;
        const fakeUrl = `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/private/${fakePublicId}`; // Fake URL structure
        referenceImagesData.push({
            // IMPORTANT: Use the structure your DB expects. If you store public_id use that, otherwise use url.
            // Option 1: Store fake URLs (matching original placeholder code)
             url: fakeUrl,
            // Option 2: Store fake public_ids (if your DB stores this)
            // public_id: fakePublicId,
            name: `random_image_${i + 1}.jpg`
        });
    }

    // --- Construct the Booking Payload (MATCH YOUR DB COLUMNS!) ---
    const testBookingData = {
        // --- Personal Info ---
        name: `Test User ${timestamp}`,
        email: `test_${timestamp}@example.com`,
        phone: generateRandomPhone(),
        dob: `19${getRandomInt(75, 99)}-${String(getRandomInt(1, 12)).padStart(2, '0')}-${String(getRandomInt(1, 28)).padStart(2, '0')}`, // YYYY-MM-DD, ensures >18
        preferred_contact: getRandomElement(contactMethods),
        instagram_handle: `@testgram_${timestamp}`, // Ensure this is snake_case too if you have it
        facebook_profile: null, // <--- MAKE SURE THIS KEY IS snake_case
        // --- Tattoo Details ---
        category: selectedCategory,
        placement: selectedPlacement,
        tattoo_size: getRandomInt(2, 15),
        is_color: getRandomBoolean(),
        is_cover_up: getRandomBoolean(),
        complexity: getRandomInt(1, 3), // 1=Simple, 2=Detailed, 3=Intricate
        creative_freedom: getRandomInt(0, 10) * 10, // 0 to 100 in steps of 10
        specific_reqs: `Test specific requirements generated at ${new Date(timestamp).toLocaleString()}.`,
        must_haves: 'Test element required.',
        color_prefs: getRandomBoolean() ? 'Vibrant test colors' : 'Black and grey test',
        placement_notes: 'Test placement notes.',

        // --- Scheduling ---
        requested_date: getRandomDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)).toISOString(), // 3 days to 2 months ahead
        requested_time: getRandomElement(availableTimeSlots),
        // urgencyLevel: getRandomElement(['flexible', 'normal', 'specific']), // Add column if you store this
        artist_preference: getRandomBoolean() ? 'Test Artist A' : null,

        // --- Estimates & Pricing ---
        estimated_duration: estimatedDuration,
        estimated_sessions: Math.ceil(estimatedDuration / (6 * 60)), // Approx sessions based on 6hr max
        pricing_details: { // Ensure this JSON structure matches your DB column type (jsonb)
            basePrice: getRandomInt(1000, 3000),
            complexityPrice: getRandomInt(0, 2000),
            placementPrice: getRandomInt(0, 1000),
            colorPrice: getRandomInt(0, 1500),
            coverUpPrice: getRandomInt(0, 1000),
            total: getRandomInt(1500, 8500), // Make sure total is plausible
        },

        // --- References ---
        reference_image_urls: referenceImagesData, // Array of placeholder objects

        // --- Agreements & Status ---
        terms_agreed: true,
        medical_confirmed: true,
        age_confirmed: true,
        status: 'Pending', // Initial status for a new booking

        // created_at: Defaults to now() in Supabase usually
    };
    return testBookingData;
}


// --- Main Execution Function ---
// --- Main Execution Function ---
async function submitTest() {
    console.log("Generating test booking data...");
    const testData = await createTestData();
    console.log("Test Data:", JSON.stringify(testData, null, 2));

    console.log(`\nAttempting to insert into Supabase table: ${bookingsTableName}...`);

    // ***** MODIFY THIS LINE *****
    const { data, error } = await supabase
        .from(bookingsTableName)
        .insert([testData], { returning: 'minimal' }); // Use returning: 'minimal' and REMOVE .select()

    // Note: 'data' will likely be null or an empty array when using 'minimal'

    if (error) {
        console.error("\n--- Supabase Insertion Error ---");
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        console.error("Error Details:", error.details);
        console.error("Hint:", error.hint);
        console.error("---------------------------------");
    } else {
        // Modify success log as 'data' will be minimal/null
        console.log("\n--- Supabase Insertion Success (minimal return) ---");
        console.log("Insert operation completed successfully (data not returned).");
        console.log("--------------------------------------------------");
    }
}

// --- Run the test ---
submitTest();