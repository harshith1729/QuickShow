# QuickShow 🎬 — Full‑Stack Movie Ticket Booking Platform 🎬

A full‑stack movie ticket booking platform inspired by BookMyShow. Built using **MERN Stack + Clerk Auth + Stripe (Test Mode) + TMDB API + Inngest**.

This project includes:

* 🎞 Movie listings (from TMDB API)
* 📅 Dynamic date & showtime selection
* 🎟 Seat booking system
* 💳 Stripe test-mode payments
* 📧 Email confirmations
* ⭐ Favourites system
* 👤 Clerk authentication
* 🛠 Admin show management
* 🌐 Fully deployed frontend & backend

---

## 🚀 Tech Stack

### **Frontend**

* React + Vite
* TailwindCSS
* Clerk Authentication
* Axios
* Lucide Icons
* React Hot Toast

### **Backend**

* Node.js + Express
* MongoDB + Mongoose
* Stripe (Test Mode)
* Inngest (Background jobs)
* Nodemailer
* TMDB API

---

## 📦 Project Structure

```
QuickShow/
│── frontend/
│   ├── components/
│   ├── context/
│   ├── lib/
│   ├── pages/
│   ├── public/
│   └── .env
│
└── backend/
    ├── controllers/
    ├── models/
    ├── routes/
    ├── configs/
    └── .env
```

---

## 🔧 Installation & Setup

Clone the repository:

```bash
git clone https://github.com/harshith1729/QuickShow.git
cd QuickShow
```

---

## 🖥️ Frontend Setup

```
cd frontend
npm install
```

Create **frontend/.env** file:

```
VITE_CURRENCY=
VITE_CLERK_PUBLISHABLE_KEY=
VITE_BASE_URL=
VITE_TMDB_IMAGE_BASE_URL=
```

Run the frontend:

```
npm run dev
```

---

## 🛠 Backend Setup

```
cd backend
npm install
```

Create **backend/.env** file:

```
MONGODB_URI=
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
TMDB_API_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDER_EMAIL=
SMTP_USER=
SMTP_PASS=
```

Run backend:

```
nodemon server.js
```

---

## ⚙️ Features

### **🎬 Movie Management (Admin)**

* Add shows
* Select start/end date
* Add multiple showtimes

### **🎟 Ticket Booking Flow**

1. User selects a movie
2. Picks a date
3. Picks a time slot
4. Selects seats
5. Proceeds to payment
6. Receives confirmation email

### **💳 Stripe Test Payments**

Currently using **Stripe Test Mode**.
Live mode will be replaced using another API in the next project.

---

## 📡 API Endpoints

### Public

```
GET /api/show/:movieId
GET /api/shows
```

### Auth Required

```
POST /api/user/update-favourite
POST /api/booking/create-checkout-session
POST /api/booking/webhook
```

---

## 📸 UI Preview

(You can add screenshots here later)

---

## 📝 Notes

* Stripe Live Mode is not active due to bank verification requirements.
* Webhook may return 404 in test mode — this is expected.
* Date system works based on start/end dates from admin show settings.

---

## 🏁 Future Improvements

* Integrate alternate payment gateway (PhonePe/Razorpay/Paytm)
* Auto PDF ticket generation
* QR code scanning
* Admin dashboard UI
* Real‑time seat locking

---

## 🤝 Contributing

PRs are welcome! Feel free to report issues or suggest improvements.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Harshith**

* GitHub: [https://github.com/harshith1729](https://github.com/harshith1729)

---

⭐ If you like this project, don't forget to star the repo!

---

# 📚 Overview

**QuickShow** is a full‑stack movie ticket booking system inspired by BookMyShow. It includes:

* Live movie data from **TMDB API**
* Dynamic **date & showtime** generation
* **Seat booking** with occupancy tracking
* **Email confirmations** via Nodemailer
* **Stripe Test Mode** checkout
* **Clerk Authentication**
* **Inngest background events**
* Admin show management

This README covers everything in detail: architecture, setup, features, APIs, folder structure, environment variables, and future plans.

---

# 🏗️ Architecture

```
Frontend (React + Vite + Tailwind)
    ↕ API Calls (Axios)
Backend (Node + Express)
    ↕ Database (MongoDB + Mongoose)
Auth (Clerk)
Payments (Stripe Test Mode)
Background Jobs (Inngest)
Movie Data (TMDB API)
Email Service (SMTP / Nodemailer)
```

---

# 📂 Folder Structure

```
QuickShow/
│── frontend/
│   ├── components/        # UI components
│   ├── context/           # Global state (AppContext)
│   ├── lib/               # Utilities (date, time, formatting)
│   ├── pages/             # All pages
│   ├── public/
│   └── .env               # Frontend environment vars
│
└── backend/
    ├── controllers/       # Route handlers (shows, bookings, users)
    ├── models/            # MongoDB models
    ├── routes/            # REST API routes
    ├── configs/           # DB, nodemailer, stripe setup
    └── .env               # Backend environment vars
```

---

# 🎬 Features (Detailed)

## 👤 User Features

### ✔ Browse Movies

* Live movie list fetched from TMDB
* Posters, rating, cast, genre, runtime

### ✔ View Show Details

* Movie overview, cast
* Available dates & timings
* Dynamic date pagination

### ✔ Book Tickets

* Choose date → time slot → seats
* Checkout using Stripe
* Email confirmation

### ✔ Favourite Movies

* Add/remove from favourites
* Synced across devices

### ✔ Authentication

* Login/Register with Clerk
* Protect booking routes

---

## 🛠 Admin Features

* Add new shows
* Choose start & end date
* Add showtimes
* Manage ticket price
* All shows auto‑expire after `endDate`
* Inngest triggers background events on show creation

---

# 🧠 How Show Dates Work

Backend generates all dates **between startDate & endDate**.
Example:

```
startDate: 2025‑11‑15
endDate:   2025‑11‑20
```

Generated dates:

```
15, 16, 17, 18, 19, 20
```

Each date has showtimes like:

```
10:00, 14:00, 18:00, 21:00
```

Frontend paginates these automatically.

---

# 🔑 Environment Variables

## 🔵 **Frontend .env**

```
VITE_CURRENCY=
VITE_CLERK_PUBLISHABLE_KEY=
VITE_BASE_URL=
VITE_TMDB_IMAGE_BASE_URL=
```

## 🟠 **Backend .env**

```
MONGODB_URI=
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
TMDB_API_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDER_EMAIL=
SMTP_USER=
SMTP_PASS=
```

---

# 🧪 Running the Project

## Frontend

```
cd frontend
npm install
npm run dev
```

## Backend

```
cd backend
npm install
npm run dev
```

---

# 🌐 API Documentation

## 🎥 GET /api/show/:movieId

Returns:

```
{
  success: true,
  movie: {...},
  dateTime: {
    "2025-11-15": [ { time, showId, occupiedSeats } ],
    ...
  }
}
```

## 🎞 GET /api/shows

Returns all currently active shows.

## ⭐ POST /api/user/update-favourite

Body:

```
{ movieId }
```

## 💳 POST /api/booking/create-checkout-session

Creates Stripe checkout session.

## 📬 POST /api/booking/webhook

Receives Stripe webhook events.

---

# 💳 Payment System

### Current Status

* Stripe **Test Mode** enabled
* Webhook may show 404 (expected in test mode)
* Live mode will be replaced in next project with alternative gateway

### Test Cards

```
4242 4242 4242 4242
Any future expiry
Any CVV
```

---

# 📧 Email System

Using **Nodemailer + SMTP**.
Emails sent:

* Booking confirmation
* Seat details
* Amount paid

---

# 🎨 UI Highlights

* Clean, modern layout
* Responsive design
* Animations
* Blur effects
* Component-based architecture
<img width="1280" height="689" alt="Screenshot 2025-11-16 at 02 32 17" src="https://github.com/user-attachments/assets/a194b1d6-13d4-496e-bd52-1de6d12a167d" />

<img width="1280" height="684" alt="Screenshot 2025-11-16 at 02 32 59" src="https://github.com/user-attachments/assets/cd405c2a-1de1-45c9-89ce-1bf478db836e" />

<img width="1280" height="690" alt="Screenshot 2025-11-16 at 02 33 47" src="https://github.com/user-attachments/assets/3db76710-03b9-4eec-8492-dd2ca09dc7a5" />

<img width="1280" height="688" alt="Screenshot 2025-11-16 at 02 34 34" src="https://github.com/user-attachments/assets/23324fc5-a636-4952-b5c9-23e5300f41a6" />

<img width="1280" height="688" alt="Screenshot 2025-11-16 at 02 35 03" src="https://github.com/user-attachments/assets/78c255f9-a08f-46fa-8c6f-b40e9f3dad95" />

*Payment Succeeded

<img width="985" height="378" alt="Screenshot 2025-11-16 at 02 35 41" src="https://github.com/user-attachments/assets/9c42a382-c66b-4d1e-a3cb-c608fd3e0c7f" />

* 5 minutes of time will be given using a timer we can see it 

<img width="798" height="366" alt="Screenshot 2025-11-16 at 02 36 25" src="https://github.com/user-attachments/assets/134d9449-4638-4fa9-a63d-ae31205f7a1d" />

* After time PAyment will be Failed

<img width="776" height="617" alt="Screenshot 2025-11-16 at 02 41 31" src="https://github.com/user-attachments/assets/94d0af6e-7735-4abf-bf80-a4728d30a95b" />



Live link : https://quickshow-iota-mocha.vercel.app/



---

# 🧹 Known Issues

* Stripe webhook returns 404 in test mode
* Date range limited by admin show entries
* Requires improving admin dashboard

---

# 🚀 Future Roadmap

* Replace Stripe with Razorpay/Paytm/PhonePe
* PDF ticket generation
* QR Code for entry validation
* Real‑time seat locking using websockets
* Admin dashboard UI
* Caching for TMDB requests
* Notification system (SMS / WhatsApp)

---

# 🤝 Contributing

Pull Requests are welcome. Please open an issue first to discuss changes.

#

---

# 👨‍💻 Author

**Harshith**

> GitHub: [https://github.com/harshith1729](https://github.com/harshith1729)

⭐ If you like this project, please star the repo!
