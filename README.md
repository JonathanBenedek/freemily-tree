# Freemily Tree

A free, open-source family tree viewer and editor that runs entirely in the browser and keeps your family's data in your own Google Sheet.

Live site: **[freemilytree.com](https://freemilytree.com)**

## Your data belongs to you, not to the website

This is the core idea behind Freemily Tree, and it is what makes it different from most family tree services:

- **Every family tree is a Google Sheet in the Google Drive of the person who created it.** You own the file, you can open it in Google Sheets at any time, and you can download, copy or delete it whenever you like.
- **The website has no server and no database.** It is a set of static files. Your browser reads the sheet directly from Google to draw the tree, and writes changes directly back to Google using your own Google sign-in. The person or company hosting the website never receives or stores your family's data.
- **Google's sharing settings decide who can see or change your tree.** You choose who can view it (anyone with the link) and who can edit it (people you add as Editors), the same way you share any Google file.
- **The website is replaceable.** If freemilytree.com ever goes offline, your data is still in your Google Drive, and anyone can host this code on their own domain and open the same sheets. See [Self-hosting](#self-hosting).

## Table of contents

- [Features](#features)
- [Using freemilytree.com](#using-freemilytreecom)
  - [Start a new tree](#start-a-new-tree)
  - [Open a tree you already have](#open-a-tree-you-already-have)
  - [The sheet format](#the-sheet-format)
  - [Viewing and navigating](#viewing-and-navigating)
  - [Editing and inviting editors](#editing-and-inviting-editors)
  - [Sharing links](#sharing-links)
  - [Several trees and devices](#several-trees-and-devices)
  - [Privacy and permissions](#privacy-and-permissions)
- [How it works](#how-it-works)
- [Self-hosting](#self-hosting)
  - [What you need](#what-you-need)
  - [1. Get the code](#1-get-the-code)
  - [2. Create a Google Cloud project](#2-create-a-google-cloud-project)
  - [3. Set up the OAuth consent screen](#3-set-up-the-oauth-consent-screen)
  - [4. Create an OAuth client ID](#4-create-an-oauth-client-id)
  - [5. Create a browser API key](#5-create-a-browser-api-key)
  - [6. Run it locally](#6-run-it-locally)
  - [7. Deploy](#7-deploy)
  - [Optional: other ways to edit](#optional-other-ways-to-edit)
- [Project structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

## Features

- Interactive family tree: pan, zoom, search, and focus on one person's ancestors or descendants
- Add, edit and remove people right in the tree, saved straight to your Google Sheet
- Works on phones, tablets and computers
- Share a read-only link with the whole family, or invite specific people to edit
- Links can open on a specific person and direction (ancestors or descendants)
- Several trees per person (for example, one for each side of the family), available on any device after signing in
- New users are guided step by step: create a new tree in one click, or open an existing sheet
- No account to create: viewing needs no sign-in, editing uses your Google account

## Using freemilytree.com

### Start a new tree

1. Open [freemilytree.com](https://freemilytree.com) and choose **How to**, then **Start a new family tree**.
2. Sign in with Google. The site creates a new Google Sheet in your Google Drive, inside a folder called **Freemily Trees**, adds you as the first person, and opens the tree.
3. Use the **+** button on any person to add parents, partners and children.

### Open a tree you already have

Choose **How to**, then **Open an existing family tree**, and either:

- **Choose from my Google Drive**: pick the sheet in Google's file picker, or
- **Paste a link**: a Google Sheets link or a freemilytree.com link both work.

The site checks the sheet and explains how to fix anything that is missing, such as sharing or column titles. For sheets that are not shared yet, **Fix it for me** sets them to "Anyone with the link can view".

### The sheet format

Each row is one person. The first row holds the column titles, in this order:

| Column | Meaning |
|---|---|
| `id` | A unique number for this person |
| `firstName` | First name |
| `lastName` | Last name |
| `parent1` | `id` of one parent (optional) |
| `parent2` | `id` of the other parent (optional) |
| `spouse` | `id` of their partner (optional) |
| `picture` | Link to a photo (optional) |
| `comments` | Free text, for example dates of birth (optional) |

Example:

| id | firstName | lastName | parent1 | parent2 | spouse |
|---|---|---|---|---|---|
| 1 | Dana | Cohen | 2 | 3 | |
| 2 | Ruth | Cohen | | | 3 |
| 3 | David | Cohen | | | 2 |

Here Dana's parents are Ruth and David, who are married to each other. The columns are read by position, so small differences in the titles (such as `First name`) are fine. A ready-made example is in [`family-tree-template.csv`](family-tree-template.csv).

### Viewing and navigating

- Drag to move around, pinch or use the zoom buttons, and use the search box to jump to anyone.
- Each person has an up arrow (ancestors) and a down arrow (descendants). In those views, a highlighted arrow or a short dashed line means the person has parents or children that are not shown in the current view.
- Tap a person to see their details and photo.

### Editing and inviting editors

- Tap **Sign in to edit** and sign in with Google. The first time you edit a sheet that you did not create with the site, Google asks you to select it once in its file picker. This is how you give the site permission for that one file.
- Only people with Editor access to the sheet can make changes. To invite someone, tap **Share**, type their email and tap **Invite**. Google emails them a link.
- You stay signed in when you reload the page. After about an hour, one tap on **Continue as ...** signs you back in.

### Sharing links

Tap **Share** to copy the tree's link, or to send it through your phone's share menu. Under **Open the link on** you can make the link open on a specific person, going up (ancestors) or down (descendants).

Links use these parameters:

| Parameter | Example | Meaning |
|---|---|---|
| `sheet` | `?sheet=1AbC...` | The Google Sheet ID of the tree (required) |
| `person` | `&person=12` or `&person=Dana` | Open focused on this person, by `id` or name |
| `view` | `&view=up` or `&view=down` | Ancestors (`up`, the default) or descendants (`down`) |

Anyone with the link can view the tree. Nobody can change it unless the owner added them as an Editor.

### Several trees and devices

The tree name at the top left opens **My trees**: switch between trees, create a new one, open another, or open a tree's Google Sheet in a new tab. After you sign in on any device, the site lists the trees you created or opened with it, using your Google account. On the same browser, your last tree opens automatically.

### Privacy and permissions

When you sign in, the site asks Google only for:

- **Access to the files you create or select with the site** (Google Drive `drive.file`). It cannot see any other files in your Google Drive.
- **Your name and email address**, to show who is signed in and to name a new tree.

The sign-in token is kept only in your browser, for about an hour or until you sign out. Full details: [privacy policy](https://freemilytree.com/privacy.html) and [terms of service](https://freemilytree.com/terms.html).

## How it works

Freemily Tree is a static web application: HTML, CSS and plain JavaScript, with no build step, no framework and no backend.

- **Reading a tree:** the browser downloads the sheet as CSV from Google's public export (`docs.google.com/spreadsheets/d/<id>/gviz/tq?tqx=out:csv`). This works for sheets shared as "Anyone with the link can view" and needs no sign-in. When the user is signed in, the site can also read their own private sheets through the Google Sheets API.
- **Signing in:** Google Identity Services (OAuth 2.0 token flow in the browser) with the scopes `drive.file`, `email` and `profile`.
- **Editing:** the Google Sheets API, called directly from the browser with the user's own access token.
- **Opening existing sheets:** the Google Picker. Picking a file grants the site access to that one file under `drive.file`.
- **Creating trees, sharing and inviting:** the Google Drive API (create the sheet, move it into the Freemily Trees folder, set link sharing, add editors).
- **Remembering things:** the browser's local storage holds the last opened tree, the list of trees, and the sign-in token until it expires. Nothing is stored on any server.

## Self-hosting

You can run your own copy of Freemily Tree on your own domain. It opens the same Google Sheets, so your family can move between freemilytree.com and your copy freely.

### What you need

- A Google account, to create a free Google Cloud project
- Somewhere to host static files: any web server, AWS S3 with CloudFront, Netlify, Cloudflare Pages, GitHub Pages, and so on
- Node.js, only to run the small local development server

### 1. Get the code

```bash
git clone https://github.com/JonathanBenedek/freemily-tree.git
cd freemily-tree
cp config.example.js config.js
```

### 2. Create a Google Cloud project

1. Open [console.cloud.google.com](https://console.cloud.google.com) and create a new project.
2. Under **APIs & Services > Library**, enable:
   - Google Sheets API
   - Google Drive API
   - Google Picker API

### 3. Set up the OAuth consent screen

In **Google Auth Platform** (formerly "OAuth consent screen"):

1. **Branding:** app name, support email, your home page, privacy policy and terms of service links, and your domain under **Authorised domains**.
2. **Audience:** choose **External**.
3. **Data access:** add only these scopes:
   - `https://www.googleapis.com/auth/drive.file`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`

   These are non-sensitive scopes, so Google does not require a security review. Do not add the full Google Sheets or Google Drive scopes, or users will see an "unverified app" warning.
4. While the app is in **Testing**, only the test users you list can sign in. When you are ready, choose **Publish app**. Google may ask you to verify your domain (in Google Search Console) and your branding.

### 4. Create an OAuth client ID

1. Go to **Clients > Create client**, type **Web application**.
2. Under **Authorised JavaScript origins**, add your site's address, for example `https://example.com`, and `http://localhost:3000` for local development.
3. Copy the **Client ID** into `googleClientId` in `config.js`.

### 5. Create a browser API key

The Google Picker needs an API key.

1. Go to **APIs & Services > Credentials > Create credentials > API key**.
2. Restrict it:
   - **Application restrictions:** Websites, with `https://example.com/*` and `http://localhost:3000/*`
   - **API restrictions:** Google Picker API, Google Sheets API, Google Drive API
3. Copy the key into `googleApiKey` in `config.js`.
4. Copy your **project number** (Cloud overview > Dashboard > Project info) into `googleAppId`.

The values in `config.js` are not secrets: they are sent to every visitor's browser and are protected by the restrictions above. `config.js` is still kept out of git so that each deployment uses its own.

### 6. Run it locally

```bash
node server.js
```

Then open [http://localhost:3000](http://localhost:3000). The site needs to be served over `http://localhost` or `https://`; opening `index.html` directly from disk will not work with Google sign-in.

### 7. Deploy

Upload these files to the root of your site:

```
index.html  config.js  app.js  onboarding.js  share.js  style.css
manifest.json  privacy.html  terms.html
```

There is nothing to build. A few things to keep in mind:

- **Caching:** if you use a CDN, either give the files short cache times or add a version to the script links (for example `app.js?v=2`) on every release. Otherwise visitors may get a new `index.html` with old scripts.
- **Legal pages:** `privacy.html` and `terms.html` describe freemilytree.com. Update them with your own name and contact details. Google requires them for a published app.
- **Credit:** the footer credits the original author. You are welcome to keep it.

#### Deploying to AWS S3 and CloudFront

`deploy.sh` uploads the files to an S3 bucket, adds versioned links to the scripts automatically, clears the CloudFront cache and, optionally, Cloudflare's.

```bash
cp .deploy.env.example .deploy.env   # then fill in your bucket, address and distribution
./deploy.sh
```

It needs the AWS CLI, signed in with permission to write to the bucket and create CloudFront invalidations.

### Optional: other ways to edit

Under **Settings > Advanced**, a user can use their own Google Cloud Client ID instead of the site's, or connect an Apps Script web app that writes to the sheet. These are mainly for special setups; the built-in sign-in covers normal use.

## Project structure

| File | Purpose |
|---|---|
| `index.html` | Page layout: home, guide, settings, tree view, dialogs |
| `app.js` | Tree layout and drawing, Google sign-in, reading and writing the sheet, My trees |
| `onboarding.js` | The step-by-step "How to" guide and the sheet checks |
| `share.js` | The Share dialog: links and inviting editors |
| `style.css` | All styles, including the mobile layout |
| `config.example.js` | Template for `config.js` (Google Client ID, API key, project number) |
| `server.js` | Small local development server (`node server.js`) |
| `deploy.sh` | Optional deploy script for AWS S3 and CloudFront |
| `privacy.html`, `terms.html` | Privacy policy and terms of service |
| `family-tree-template.csv` | Example sheet with the right columns |

## Contributing

Issues and pull requests are welcome. The project deliberately has no build step and no dependencies, so changes can be tested by running `node server.js` and opening the site in a browser. Please check the main flows on both a phone-sized screen and a desktop before submitting.

## License

Released under the [MIT License](LICENSE).

## Author

Created by [Jonathan Benedek](https://www.linkedin.com/in/jonathan-benedek-58a039123/).

Special thanks to [Nadav Benedek](https://www.linkedin.com/in/nadavbenedek/).
