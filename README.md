# iTrack Open Source Workout App

iTrack is an open-source workout application designed to help users track their workouts, monitor progress, and achieve fitness goals. Built using TypeScript and React, it offers a clean and intuitive interface for managing workout routines.

![itrack logo banner](./fastlane/metadata/android/en-US/images/phoneScreenshots/Frame%201.png)

## Features

- **Workout Tracking**: Log and track workout sessions with detailed statistics.
- **Progress Monitoring**: Visualize progress over time with charts and graphs.
- **Workout Templates**: Create and use custom workout templates for quick session setup.
- **Recent Workouts**: Quickly access and review recent workout sessions.
- **Flexible Storage**: Keep all your data locally (JSON) or sync it to the cloud with your own account.
- **Responsive Design**: Optimized for use on both desktop and mobile devices.

## Cloud Sync (optional)

By default all data is stored locally on the device (the same JSON that the
**Export Data** button produces). You can optionally sync your data across
devices by connecting a free [Supabase](https://supabase.com) project:

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase **SQL Editor**, run the script in [`project/supabase/schema.sql`](./project/supabase/schema.sql).
3. Copy `project/.env.example` to `project/.env` and fill in your project URL and anon key
   (found under **Project Settings → API**).
4. Rebuild / restart the dev server.

Once configured, an account icon appears next to the theme switcher. Sign up or
sign in, then choose **Cloud (Supabase)** under **Settings → Data Storage** to
back up and sync your workouts. Without these variables the app runs exactly as
before, fully offline.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/xaxoman/iTrack-open-source-workout-app.git
   cd iTrack-open-source-workout-app
   ```
   
2. Install dependencies:

```sh
npm install
# or
yarn install
```
3. Start the development server:

```sh
npm run dev
# or
yarn dev
```


### Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (git checkout -b feature/your-feature-name)
3. Commit your changes (git commit -m 'Add some feature')
4. Push to the branch (git push origin feature/your-feature-name)
5. Open a Pull Request


License
This project is licensed under the Apache License 2.0. See the LICENSE file for details.

