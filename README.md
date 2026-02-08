# SwiftFlight

SwiftFlight is a minimalist flight search prototype that surfaces the top three stress-free flight options (lowest price + shortest duration) using live data from the Skyscanner RapidAPI.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with your RapidAPI key:
   ```bash
   RAPIDAPI_KEY=your_key_here
   DEFAULT_ORIGIN=SFO
   DEFAULT_DESTINATION=LAX
   DEFAULT_DATE=2024-12-01
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Notes

- The app only uses the public Skyscanner API via RapidAPI. No scraping or private endpoints are required.
- `getStaticProps` fetches an initial set of flights and revalidates every 30 minutes.
