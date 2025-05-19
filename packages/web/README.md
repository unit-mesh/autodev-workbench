# Getting Started

First, run the development server:

Create a .env file in the web directory and fill in the environment variables.
```bash
cp env.example .env
```
Postgres DB recommends using Neon's services https://console.neon.tech/ 

```bash
POSTGRES_URL=your posteres url
POSTGRES_URL_NON_POOLING=your posteres url
DATABASE_URL=your database url here
GLM_TOKEN=your token here
SECRET="your secret here"
GITHUB_CLIENT_ID="your id here"
GITHUB_CLIENT_SECRET="your secret here"
```

To view the Db table, you can open the Prisma folder in the project's web/Prisma directory
Initialize database tables, you can perform Prisma migration bash.
Prisma uses the DATABASE_URL in. env
```bash
cd web
npx prisma migrate dev
```

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically
optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions
are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use
the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for
more details.
