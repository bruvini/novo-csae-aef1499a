# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/391ba209-0df4-4938-a2ba-ef6c59e4c9dc

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/391ba209-0df4-4938-a2ba-ef6c59e4c9dc) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/391ba209-0df4-4938-a2ba-ef6c59e4c9dc) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Configuring Firebase Storage CORS

The project includes a CORS configuration for Firebase Storage. It allows the production domain `https://csae.com.br` and the local development domain `http://localhost:3000` to access the bucket with the methods `GET`, `POST`, `PUT`, `DELETE` and `OPTIONS`. The response headers `Content-Type`, `Authorization` and `x-goog-meta-*` are exposed.

To apply it, install the [Google Cloud SDK](https://cloud.google.com/sdk) and run:

```sh
./scripts/set-storage-cors.sh
```

The script uses `gsutil cors set` to apply `scripts/cors.json` to the bucket `gs://csaefloripa.appspot.com`. It also runs `gsutil cors get` so you can verify the configuration was applied successfully.
