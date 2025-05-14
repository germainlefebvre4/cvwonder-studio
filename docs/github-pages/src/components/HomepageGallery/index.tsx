import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';

const themes = [
  {
    title: 'Default Theme',
    image: require('@site/static/img/theme-default-w800px.png').default,
    description: 'Clean, professional design suitable for all industries'
  },
  {
    title: 'Basic',
    image: require('@site/static/img/theme-basic-w800px.png').default,
    description: 'A simple and straightforward layout for quick CV creation'
  },
  {
    title: 'Horizon Timeline',
    image: require('@site/static/img/theme-horizon-timeline-w800px.png').default,
    description: 'Modern timeline layout with visual emphasis on career progression'
  },
];

export default function HomepageGallery() {
  return (
    <section className={clsx(styles.themesSection, 'bg-alt')}>
      <div className="container">
        <div className="text--center margin-bottom--xl">
          <Heading as="h2">Theme Gallery</Heading>
          <p className={styles.sectionSubtitle}>
            Explore our collection of themes to find the perfect look for your CV.
            Each theme is designed to highlight your skills and experience in a unique way.
          </p>
        </div>
        <div className="row">
          {themes.map((theme, idx) => (
            <div className="col col--4" key={idx}>
              <div className={styles.themeCard}>
                <div className={styles.themeImageWrapper}>
                  <div className={styles.themeImagePlaceholder}>
                    <img
                      src={theme.image}
                      alt={theme.title}
                    />
                    <span>{theme.title}</span>
                    <small>Replace with theme screenshot</small>
                  </div>
                </div>
                <h3>{theme.title}</h3>
                <p>{theme.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text--center margin-top--lg">
          <Link
            className="button button--primary button--lg"
            to="https://studio.cvwonder.fr/gallery">
            Explore the Gallery
          </Link>
        </div>
      </div>
    </section>
  );
}