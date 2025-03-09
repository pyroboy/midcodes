## Tables
### bookings
- Columns: id, first_name, last_name, email, phone, check_in, check_out, adults, children, room_id, special_requests, created_at, status

### rooms
- Columns: id, name, description, beds, capacity, features, size, image, price

## Relationships
- bookings.room_id → rooms.id (Many-to-One)

## Workflow
1. User selects a room from the homepage
2. User fills out the booking form in a modal
3. On submission, data is saved to Supabase
4. Confirmation is shown to the user
5. Admin can view and manage bookings (future feature)

## Key Calculations
- Total price calculation based on room price and length of stay
- Availability checking (future feature)

## Data Entry Constraints
- All fields except special_requests are required
- check_in date must be before check_out date
- check_in date must not be in the past
- adults must be at least 1
- children can be 0 or more

## Per Component instructions

### @BookingModal.svelte
#### Description
A modal component that displays a form for users to enter booking details.

#### Props
- room: Room - The selected room data
- show: boolean - Controls visibility of the modal
- onClose: () => void - Function to close the modal

#### Instructions
- Display form fields for all required booking information
- Validate form input before submission
- Show appropriate error messages
- On successful submission, close modal and show confirmation

### @BookingForm.svelte
#### Description
The form component inside the booking modal.

#### Props
- room: Room - The selected room data
- onSubmit: (bookingData: BookingData) => void - Function to handle form submission

#### Instructions
- Include all required fields with proper validation
- Calculate total price based on room price and length of stay
- Display room details for confirmation
