import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const links = [
  {
    title: 'Overview',
    text: 'What this probe is trying to prove.',
    to: '/docs/intro',
  },
  {
    title: 'Run the probe',
    text: 'Start the local Minecraft server and Mineflayer actor.',
    to: '/docs/Setup/Headless-Server',
  },
  {
    title: 'Runtime loop',
    text: 'How turns become verified artifacts.',
    to: '/docs/Architecture/Runtime-Loop-And-Verification',
  },
  {
    title: 'Future works',
    text: 'What the latest live home-base run exposed.',
    to: '/docs/Architecture/Future-Works',
  },
];

function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.imageLayer} aria-hidden="true" />
        <div className={styles.gridLayer} aria-hidden="true" />
        <div className={clsx('container', styles.heroInner)}>
          <p className={styles.eyebrow}>Mineflayer · TypeScript · LLM agents</p>
          <Heading as="h1" className={styles.title}>
            <span className={styles.desktopTitle}>minecraft-llm-agent-community</span>
            <span className={styles.mobileTitle}>
              Minecraft LLM
              <br />
              agents.
            </span>
          </Heading>
          <p className={styles.lead}>
            A headless Minecraft runtime for Soul-grounded social-cycle
            experiments, bounded agent actions, truthful transcripts, and
            evidence you can inspect after the run.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primaryAction} to="/docs/intro">
              Read overview
            </Link>
            <Link className={styles.secondaryAction} to="/docs/Setup/Headless-Server">
              Run locally
            </Link>
          </div>
        </div>
        <div className={styles.scrollHint} aria-hidden="true">
          Current build
        </div>
      </section>

      <section className={styles.linkSection}>
        <div className={clsx('container', styles.linkGrid)}>
          {links.map((item) => (
            <Link className={styles.linkCard} to={item.to} key={item.title}>
              <span>{item.title}</span>
              <p>{item.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="A bounded Minecraft LLM-agent probe built on Mineflayer, transcripts, and runtime-owned verification.">
      <HomePage />
    </Layout>
  );
}
