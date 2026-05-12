import Link from "next/link";
import {
  ArrowRight,
  Binary,
  Ghost,
  LockKeyhole,
  MessageSquare,
  MonitorSmartphone,
  Sparkles,
  Tags,
  TrendingUp,
  Vote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const feedSignals = [
  "Confessions that feel like commit messages",
  "Anonymous polls about meetings, canteen, and buglife",
  "Office lore, tags, GIF replies, and trending reactions",
];

const productPillars = [
  {
    icon: Ghost,
    title: "Anonymous by default",
    description:
      "Fake handles, fake echologyx aliases, and profile hints that keep the mystery intact.",
  },
  {
    icon: Vote,
    title: "Built for momentum",
    description:
      "Polls, reactions, heat levels, and daily prompts turn random thoughts into repeat visits.",
  },
  {
    icon: LockKeyhole,
    title: "Privately moderated",
    description:
      "Public anonymity for employees, internal audit trails and admin controls for moderation.",
  },
];

const featureGrid = [
  {
    icon: MessageSquare,
    label: "Confessions",
    copy: "Short anonymous drops about meetings, bugs, wins, and office chaos.",
  },
  {
    icon: Tags,
    label: "Tags + filters",
    copy: "Track moods through #meeting, #salaryweek, #remote-work, and whatever comes next.",
  },
  {
    icon: Vote,
    label: "Live polls",
    copy: "Quick votes with percentages, expiry, and debate without exposing identity.",
  },
  {
    icon: TrendingUp,
    label: "Trending feed",
    copy: "Surface the hottest thoughts based on reactions, comments, and poll activity.",
  },
  {
    icon: Binary,
    label: "Developer-native",
    copy: "Markdown, code blocks, meme energy, and a UI that feels like a hidden dev forum.",
  },
  {
    icon: MonitorSmartphone,
    label: "Responsive everywhere",
    copy: "Desktop sidebars, mobile nav, tablet-friendly cards, and fast repeat scrolling.",
  },
];

const promptExamples = [
  "What ruined your day?",
  "Which meeting could have been a README?",
  "Who fixed prod by accident again?",
];

export default function Home() {
  return (
    <div className="shadow-feed-shell flex min-h-screen flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
              <Ghost className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                Echologyx internal
              </p>
              <h1 className="text-lg font-semibold">ShadowFeed</h1>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#experience" className="transition-colors hover:text-foreground">
              Experience
            </a>
            <a href="#launch" className="transition-colors hover:text-foreground">
              Launch flow
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/quiz">
                Enter the quiz
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-10 lg:px-10 lg:py-14">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden p-0">
            <div className="flex h-full flex-col gap-8 p-8 lg:p-10">
              <Badge className="w-fit">Anonymous developer social network</Badge>
              <div className="space-y-5">
                <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  The underground office feed where code jokes, confessions, and side-eye survive.
                </h2>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  ShadowFeed turns internal office culture into a private, addictive developer
                  community: fake identities, real reactions, polls, tags, and daily chaos prompts.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {feedSignals.map((signal) => (
                  <div
                    key={signal}
                    className="rounded-3xl border border-border/80 bg-white/4 px-4 py-4 text-sm leading-6 text-secondary-foreground"
                  >
                    {signal}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="sm:min-w-48">
                  <Link href="/feed">
                    Preview the feed
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="sm:min-w-48">
                  <Link href="/sign-up">Create anonymous account</Link>
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-8 lg:p-10">
            <CardHeader className="gap-4">
              <Badge variant="muted" className="w-fit">
                Today&apos;s chaos prompt
              </Badge>
              <CardTitle className="text-2xl sm:text-3xl">
                What silently annoyed you today?
              </CardTitle>
              <CardDescription>
                Start the loop with one thought, one GIF, or one poll. Heat rises from reactions,
                comments, and shared curiosity.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-[1.5rem] border border-primary/20 bg-primary/7 p-5">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
                  sample post format
                </p>
                <p className="mt-3 text-lg leading-8 text-foreground">
                  &ldquo;This meeting could have been a markdown file and two reactions.&rdquo;
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>#meeting</span>
                  <span>#buglife</span>
                  <span>#same-bro</span>
                </div>
              </div>

              <div className="space-y-3">
                {promptExamples.map((prompt) => (
                  <div
                    key={prompt}
                    className="flex items-center justify-between rounded-2xl border border-border/80 bg-white/4 px-4 py-3 text-sm text-secondary-foreground"
                  >
                    <span>{prompt}</span>
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="features" className="grid gap-5 lg:grid-cols-3">
          {productPillars.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/80 bg-white/5 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section id="experience" className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <Badge variant="muted" className="w-fit">
                Product loop
              </Badge>
              <CardTitle className="text-3xl">A developer-first interaction model</CardTitle>
              <CardDescription>
                Not corporate. Not HR. Not a generic forum. This feels like a private side channel
                that grew teeth.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {featureGrid.map(({ icon: Icon, label, copy }) => (
                <div
                  key={label}
                  className="flex gap-4 rounded-[1.4rem] border border-border/80 bg-white/4 p-4"
                >
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-black/20 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{label}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="muted" className="w-fit">
                Feed personality
              </Badge>
              <CardTitle className="text-3xl">Built to spread inside engineering teams</CardTitle>
              <CardDescription>
                The first version ships with categories, post reactions, tags, comments toggle,
                GIF support, quiz-gated sign-up, and a moderation-safe anonymous identity model.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {[
                "Confession",
                "Unpopular Opinion",
                "Funny Moment",
                "Work Struggle",
                "Secret Win",
                "Poll",
                "Meme",
                "Suggestion",
              ].map((category) => (
                <div
                  key={category}
                  className="rounded-3xl border border-border/80 bg-white/4 px-4 py-4"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">
                    category
                  </p>
                  <p className="mt-2 text-base text-foreground">{category}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section id="launch" className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <Badge variant="muted" className="w-fit">
                Launch flow
              </Badge>
              <CardTitle className="text-3xl">How users enter ShadowFeed</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {[
                "Pass a light Echologyx office quiz before sign-up.",
                "Generate a fake username and @echologyx.com alias.",
                "Set a password and optional recovery questions later.",
                "Post anonymously, react quickly, follow tags, and watch the heat meter rise.",
              ].map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 rounded-[1.4rem] border border-border/80 bg-white/4 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-mono text-sm text-primary">
                    0{index + 1}
                  </div>
                  <p className="pt-2 text-sm leading-6 text-secondary-foreground">{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="muted" className="w-fit">
                Ready to build
              </Badge>
              <CardTitle className="text-3xl">The full product stack is now in motion</CardTitle>
              <CardDescription>
                Next.js App Router, Prisma on Neon, Auth.js credentials, markdown posts, polls,
                tags, GIFs, responsive layouts, and internal moderation controls.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild size="lg" className="w-full justify-between">
                <Link href="/sign-up">
                  Start with the quiz gate
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full justify-between">
                <Link href="/feed">
                  View feed prototype
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
