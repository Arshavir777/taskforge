export type IconName = 'webhook' | 'table' | 'image' | 'mail' | 'chart' | 'link'

export interface Service {
  icon: IconName
  title: string
  description: string
  tag: string
}

export const services: Service[] = [
  {
    icon: 'webhook',
    title: 'Webhook delivery',
    description: 'Send HMAC-signed events to your endpoints. Server errors and timeouts are retried automatically.',
    tag: 'webhook_delivery',
  },
  {
    icon: 'table',
    title: 'CSV import',
    description: 'Import large CSV files in batches, validate every row and watch progress live.',
    tag: 'csv_import',
  },
  {
    icon: 'image',
    title: 'Image thumbnails',
    description: 'Turn one upload into three thumbnail sizes, stored in S3-compatible storage.',
    tag: 'image_thumbnail',
  },
  {
    icon: 'mail',
    title: 'Email sending',
    description: 'Rate-limited delivery to your mail provider, with protection against duplicate sends.',
    tag: 'email_send',
  },
  {
    icon: 'chart',
    title: 'Scheduled reports',
    description: 'Recurring jobs that build CSV reports of your activity and store them for download.',
    tag: 'report_generate',
  },
  {
    icon: 'link',
    title: 'Link checking',
    description: 'Fan a list of URLs out to parallel child jobs and get one combined result back.',
    tag: 'link_check',
  },
]

export const steps = [
  {
    title: 'Submit a job',
    description: 'POST a typed payload to the API. An idempotency key makes retries from your side safe.',
  },
  {
    title: 'Workers pick it up',
    description: 'Workers claim jobs from Postgres with SKIP LOCKED. Leases bring back jobs from crashed workers.',
  },
  {
    title: 'Follow the result',
    description: 'Stream progress live, read the typed result, and inspect failures in the dead-letter queue.',
  },
]

export const guarantees = [
  'Retries with exponential backoff and jitter',
  'Dead-letter queue for jobs that keep failing',
  'Idempotency keys against duplicate jobs',
  'Rate limits and quotas per plan',
  'Graceful shutdown that never drops work',
  'Live progress over Server-Sent Events',
]

export const plans = [
  { tier: 'free', tone: 'slate', description: 'Everything you need to try the platform and run side projects.' },
  { tier: 'pro', tone: 'brand', description: 'Higher rate limits and quotas for production workloads.' },
  { tier: 'enterprise', tone: 'amber', description: 'The highest limits and dedicated queues for heavy traffic.' },
] as const
