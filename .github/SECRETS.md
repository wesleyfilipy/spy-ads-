# Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

## Deployment

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Railway API token from dashboard.railway.app |
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | Vercel team/org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID for the web app |

## Application

| Secret | Description |
|--------|-------------|
| `DATABASE_URL` | Production PostgreSQL connection string |
| `REDIS_URL` | Production Redis connection string |
| `JWT_SECRET` | Strong random string (min 64 chars) |
| `JWT_REFRESH_SECRET` | Strong random string (min 64 chars) |
| `NEXT_PUBLIC_API_URL` | Public API URL e.g. `https://api.yourdomain.com` |

## AWS / Storage

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS/R2 access key |
| `AWS_SECRET_ACCESS_KEY` | AWS/R2 secret key |
| `AWS_REGION` | e.g. `us-east-1` |
| `AWS_S3_BUCKET` | S3 bucket name |

## Stripe

| Secret | Description |
|--------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

## Monitoring

| Secret | Description |
|--------|-------------|
| `API_URL` | Production API URL for health checks |
| `WEB_URL` | Production web URL for health checks |
